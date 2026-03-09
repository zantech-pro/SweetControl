import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import { addGastoExtraLocal, MetodoPagamento } from '../../src/store/slices/businessSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';

function monthKey(isoDate: string) {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastMonths(count: number): string[] {
  const base = new Date();
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-');
  return `${month}/${year.slice(2)}`;
}

export default function BI() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const vendas = useSelector((state: RootState) =>
    state.business.vendas.filter((item) => item.usuario_id === activeUserId)
  );
  const gastos = useSelector((state: RootState) =>
    state.business.gastosExtras.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [categoria, setCategoria] = useState('Operacional');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix');

  const mesAtual = monthKey(new Date().toISOString());

  const vendasMes = useMemo(
    () => vendas.filter((item) => monthKey(item.data_venda) === mesAtual),
    [vendas, mesAtual]
  );
  const gastosMes = useMemo(
    () => gastos.filter((item) => monthKey(item.data_gasto) === mesAtual),
    [gastos, mesAtual]
  );

  const faturamento = useMemo(
    () => vendasMes.reduce((acc, item) => acc + item.total_liquido, 0),
    [vendasMes]
  );
  const totalGastos = useMemo(
    () => gastosMes.reduce((acc, item) => acc + item.valor, 0),
    [gastosMes]
  );
  const lucro = useMemo(() => faturamento - totalGastos, [faturamento, totalGastos]);
  const ticketMedio = useMemo(
    () => (vendasMes.length ? faturamento / vendasMes.length : 0),
    [faturamento, vendasMes]
  );

  const produtosMaisVendidos = useMemo(() => {
    const mapa: Record<string, number> = {};
    vendasMes.forEach((venda) => {
      venda.itens.forEach((item) => {
        mapa[item.nome_produto] = (mapa[item.nome_produto] ?? 0) + item.quantidade;
      });
    });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [vendasMes]);

  const monthlySeries = useMemo(() => {
    const keys = lastMonths(6);
    return keys.map((key) => {
      const vendasValue = vendas
        .filter((item) => monthKey(item.data_venda) === key)
        .reduce((acc, item) => acc + item.total_liquido, 0);
      const gastosValue = gastos
        .filter((item) => monthKey(item.data_gasto) === key)
        .reduce((acc, item) => acc + item.valor, 0);
      const saldo = vendasValue - gastosValue;
      return { key, label: monthLabel(key), vendas: vendasValue, gastos: gastosValue, saldo };
    });
  }, [gastos, vendas]);

  const maxChartValue = useMemo(() => {
    const maxVendas = Math.max(...monthlySeries.map((item) => item.vendas), 0);
    const maxGastos = Math.max(...monthlySeries.map((item) => item.gastos), 0);
    return Math.max(maxVendas, maxGastos, 1);
  }, [monthlySeries]);

  function adicionarGasto() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    const v = Number(valor.replace(',', '.'));
    if (Number.isNaN(v) || v <= 0) return;

    dispatch(
      addGastoExtraLocal({
        id: -Date.now(),
        usuario_id: activeUserId,
        categoria: categoria.trim() || 'Outros',
        descricao: descricao.trim() || 'Sem descricao',
        valor: v,
        metodo_pagamento: metodo,
        data_gasto: new Date().toISOString(),
      })
    );
    dispatch(
      enqueueSyncItem({
        entity: 'gastos_extras',
        endpoint: '/gastos/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          usuario_id: activeUserId,
          categoria: categoria.trim() || 'Outros',
          descricao: descricao.trim() || 'Sem descricao',
          valor: v,
          metodo_pagamento: metodo,
          data_gasto: new Date().toISOString().slice(0, 10),
        },
      })
    );
    setDescricao('');
    setValor('');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.title, { color: activeTheme.text }]}>BI & Financeiro</Text>
      <Text style={styles.subtitle}>Mes atual: {mesAtual}</Text>

      <View style={[styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.metric}>Faturamento: R$ {faturamento.toFixed(2)}</Text>
        <Text style={styles.metric}>Gastos: R$ {totalGastos.toFixed(2)}</Text>
        <Text style={styles.metric}>Lucro: R$ {lucro.toFixed(2)}</Text>
        <Text style={styles.metric}>Ticket medio: R$ {ticketMedio.toFixed(2)}</Text>
      </View>

      <View style={[styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Oscilacao Mensal (Vendas x Gastos)</Text>
        <View style={styles.chartRow}>
          {monthlySeries.map((item, index) => {
            const prev = index > 0 ? monthlySeries[index - 1].saldo : item.saldo;
            const trend = item.saldo > prev ? 'up' : item.saldo < prev ? 'down' : 'same';
            return (
              <View key={item.key} style={styles.chartCol}>
                <View style={styles.barsWrap}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max((item.vendas / maxChartValue) * 100, 2)}%`,
                        backgroundColor: '#1e88e5',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max((item.gastos / maxChartValue) * 100, 2)}%`,
                        backgroundColor: '#e53935',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartSaldo}>
                  {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■'} R$ {item.saldo.toFixed(0)}
                </Text>
                <Text style={styles.chartLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1e88e5' }]} />
            <Text style={styles.small}>Vendas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e53935' }]} />
            <Text style={styles.small}>Gastos</Text>
          </View>
        </View>
      </View>

      <Text style={styles.section}>Produtos mais vendidos</Text>
      {produtosMaisVendidos.length === 0 ? (
        <Text style={styles.small}>Sem vendas no mes.</Text>
      ) : (
        produtosMaisVendidos.map((item) => (
          <View key={item[0]} style={[styles.rankCard, { backgroundColor: activeTheme.card }]}>
            <Text style={{ color: activeTheme.text }}>{item[0]}</Text>
            <Text style={styles.small}>Qtd: {item[1]}</Text>
          </View>
        ))
      )}

      <View style={[styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Lancar gasto extra</Text>
        <TextInput value={categoria} onChangeText={setCategoria} placeholder="Categoria" style={styles.input} />
        <TextInput value={descricao} onChangeText={setDescricao} placeholder="Descricao" style={styles.input} />
        <TextInput value={valor} onChangeText={setValor} placeholder="Valor" keyboardType="decimal-pad" style={styles.input} />
        <View style={styles.row}>
          {(['pix', 'dinheiro', 'cartao', 'transferencia'] as MetodoPagamento[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, { borderColor: metodo === item ? activeTheme.primary : '#ccc' }]}
              onPress={() => setMetodo(item)}
            >
              <Text style={{ color: metodo === item ? activeTheme.primary : '#555' }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: activeTheme.primary }]} onPress={adicionarGasto}>
          <Text style={styles.buttonText}>Salvar gasto</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 8 },
  metricsCard: { borderRadius: 12, padding: 12, marginBottom: 10 },
  metric: { color: '#333', fontWeight: '700', marginBottom: 4 },
  section: { marginTop: 8, marginBottom: 6, fontWeight: '700', color: '#444' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { width: '15%', alignItems: 'center' },
  barsWrap: {
    width: '100%',
    height: 90,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: { width: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  chartSaldo: { fontSize: 10, color: '#444', marginTop: 3 },
  legendRow: { flexDirection: 'row', marginTop: 10, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  rankCard: { borderRadius: 10, padding: 10, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 6 },
  button: { marginTop: 8, borderRadius: 10, padding: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  small: { color: '#666' },
});
