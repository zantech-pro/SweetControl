import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import { addGastoExtraLocal, MetodoPagamento } from '../../src/store/slices/businessSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';

function monthKey(isoDate: string) {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

  function adicionarGasto() {
    const v = Number(valor.replace(',', '.'));
    if (Number.isNaN(v) || v <= 0) return;

    dispatch(
      addGastoExtraLocal({
        id: -Date.now(),
        usuario_id: activeUserId ?? 1,
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
        usuario_id: activeUserId ?? 1,
        payload: {
          usuario_id: activeUserId ?? 1,
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
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.title, { color: activeTheme.text }]}>BI & Financeiro</Text>
      <Text style={styles.subtitle}>Mes atual: {mesAtual}</Text>

      <View style={[styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.metric}>Faturamento: R$ {faturamento.toFixed(2)}</Text>
        <Text style={styles.metric}>Gastos: R$ {totalGastos.toFixed(2)}</Text>
        <Text style={styles.metric}>Lucro: R$ {lucro.toFixed(2)}</Text>
        <Text style={styles.metric}>Ticket medio: R$ {ticketMedio.toFixed(2)}</Text>
      </View>

      <Text style={styles.section}>Produtos mais vendidos</Text>
      <FlatList
        data={produtosMaisVendidos}
        keyExtractor={(item) => item[0]}
        ListEmptyComponent={<Text style={styles.small}>Sem vendas no mes.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.rankCard, { backgroundColor: activeTheme.card }]}>
            <Text style={{ color: activeTheme.text }}>{item[0]}</Text>
            <Text style={styles.small}>Qtd: {item[1]}</Text>
          </View>
        )}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 8 },
  metricsCard: { borderRadius: 12, padding: 12, marginBottom: 10 },
  metric: { color: '#333', fontWeight: '700', marginBottom: 4 },
  section: { marginTop: 8, marginBottom: 6, fontWeight: '700', color: '#444' },
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
