import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import { addMovimentacaoEstoqueLocal } from '../../src/store/slices/businessSlice';
import { adjustProdutoEstoqueLocal } from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';

function diasParaVencer(dataValidade?: string | null) {
  if (!dataValidade) return null;
  const hoje = new Date();
  const alvo = new Date(dataValidade);
  const diffMs = alvo.getTime() - hoje.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function EstoqueGestao() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const produtos = useSelector((state: RootState) => state.referenceData.produtos);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');

  const alertaReposicao = useMemo(
    () =>
      produtos.filter(
        (item) => (item.quantidade_estoque ?? 0) <= (item.estoque_minimo ?? 0)
      ),
    [produtos]
  );

  const alertaValidade = useMemo(
    () =>
      produtos
        .map((item) => ({ ...item, dias: diasParaVencer(item.data_validade) }))
        .filter((item) => item.dias !== null && item.dias <= 7),
    [produtos]
  );

  function registrarMovimento() {
    if (!produtoId) return;
    const qtd = Number(quantidade);
    if (Number.isNaN(qtd) || qtd <= 0) return;

    const produto = produtos.find((item) => item.id === produtoId);
    if (!produto) return;

    const delta = tipo === 'saida' ? -qtd : qtd;
    dispatch(adjustProdutoEstoqueLocal({ id: produtoId, delta }));
    dispatch(
      addMovimentacaoEstoqueLocal({
        id: -Date.now(),
        produto_id: produtoId,
        produto_nome: produto.nome,
        tipo_movimento: tipo,
        quantidade: qtd,
        motivo: motivo.trim() || 'Movimento manual',
        referencia_tipo: 'ajuste',
        referencia_id: null,
        data_movimento: new Date().toISOString(),
      })
    );
    dispatch(
      enqueueSyncItem({
        entity: 'movimentacoes_estoque',
        endpoint: '/estoque/movimentacoes/create.php',
        method: 'POST',
        payload: {
          produto_id: produtoId,
          tipo_movimento: tipo,
          quantidade: qtd,
          motivo: motivo.trim() || 'Movimento manual',
          referencia_tipo: 'ajuste',
          referencia_id: null,
        },
      })
    );
    setQuantidade('');
    setMotivo('');
  }

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.title, { color: activeTheme.text }]}>Gestao de Estoque</Text>

      <Text style={styles.section}>Alerta de reposicao</Text>
      <FlatList
        data={alertaReposicao}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        ListEmptyComponent={<Text style={styles.small}>Sem alertas de reposicao.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.alertCard, { backgroundColor: '#fff8e1' }]}>
            <Text style={styles.alertTitle}>{item.nome}</Text>
            <Text style={styles.small}>
              Estoque: {item.quantidade_estoque ?? 0} | Minimo: {item.estoque_minimo ?? 0}
            </Text>
          </View>
        )}
      />

      <Text style={styles.section}>Controle de validade (7 dias)</Text>
      <FlatList
        data={alertaValidade}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        ListEmptyComponent={<Text style={styles.small}>Sem produtos proximos da validade.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.alertCard, { backgroundColor: '#ffebee' }]}>
            <Text style={styles.alertTitle}>{item.nome}</Text>
            <Text style={styles.small}>
              Validade: {item.data_validade} | {item.dias} dia(s)
            </Text>
          </View>
        )}
      />

      <Text style={styles.section}>Movimentacao manual</Text>
      <FlatList
        horizontal
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 6 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: produtoId === item.id ? activeTheme.primary : '#ccc' },
            ]}
            onPress={() => setProdutoId(item.id)}
          >
            <Text style={{ color: produtoId === item.id ? activeTheme.primary : '#555' }}>{item.nome}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.row}>
        {(['entrada', 'saida', 'ajuste'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, { borderColor: tipo === item ? activeTheme.primary : '#ccc' }]}
            onPress={() => setTipo(item)}
          >
            <Text style={{ color: tipo === item ? activeTheme.primary : '#555' }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={quantidade}
        onChangeText={setQuantidade}
        placeholder="Quantidade"
        keyboardType="number-pad"
        style={styles.input}
      />
      <TextInput
        value={motivo}
        onChangeText={setMotivo}
        placeholder="Motivo"
        style={styles.input}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: activeTheme.primary }]} onPress={registrarMovimento}>
        <Text style={styles.buttonText}>Registrar movimentacao</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  section: { marginTop: 10, marginBottom: 6, fontWeight: '700', color: '#444' },
  alertCard: { borderRadius: 10, padding: 10, marginRight: 8, minWidth: 180 },
  alertTitle: { fontWeight: '700', color: '#333' },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  row: { flexDirection: 'row', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    backgroundColor: '#fff',
  },
  button: { marginTop: 10, borderRadius: 10, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  small: { color: '#666' },
});

