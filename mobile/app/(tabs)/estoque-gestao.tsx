import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import { addMovimentacaoEstoqueLocal } from '../../src/store/slices/businessSlice';
import { adjustProdutoEstoqueLocal } from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import { ui } from '../../src/ui/ui';

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
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const produtos = useSelector((state: RootState) =>
    state.referenceData.produtos.filter((item) => item.usuario_id === activeUserId)
  );
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
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    if (!produtoId) return;
    const qtd = Number(quantidade);
    if (Number.isNaN(qtd) || qtd <= 0) return;

    const produto = produtos.find((item) => item.id === produtoId);
    if (!produto) return;

    const delta = tipo === 'saida' ? -qtd : qtd;
    dispatch(
      adjustProdutoEstoqueLocal({
        id: produtoId,
        usuario_id: activeUserId,
        delta,
      })
    );
    dispatch(
      addMovimentacaoEstoqueLocal({
        id: -Date.now(),
        usuario_id: activeUserId,
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
        usuario_id: activeUserId,
        payload: {
          produto_id: produtoId,
          usuario_id: activeUserId,
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
    <KeyboardAvoidingView
      style={[ui.screen, { backgroundColor: activeTheme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[ui.title, { color: activeTheme.text }]}>Gestao de Estoque</Text>

        <Text style={styles.section}>Alerta de reposicao</Text>
        {alertaReposicao.length === 0 ? (
          <Text style={styles.small}>Sem alertas de reposicao.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {alertaReposicao.map((item) => (
              <View key={item.id} style={[ui.listCard, styles.alertCard, { backgroundColor: '#fff8e1' }]}>
                <Text style={styles.alertTitle}>{item.nome}</Text>
                <Text style={styles.small}>
                  Estoque: {item.quantidade_estoque ?? 0} | Minimo: {item.estoque_minimo ?? 0}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.section}>Controle de validade (7 dias)</Text>
        {alertaValidade.length === 0 ? (
          <Text style={styles.small}>Sem produtos proximos da validade.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {alertaValidade.map((item) => (
              <View key={item.id} style={[ui.listCard, styles.alertCard, { backgroundColor: '#ffebee' }]}>
                <Text style={styles.alertTitle}>{item.nome}</Text>
                <Text style={styles.small}>
                  Validade: {item.data_validade} | {item.dias} dia(s)
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.section}>Movimentacao manual</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
          {produtos.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                ui.chip,
                { borderColor: produtoId === item.id ? activeTheme.primary : '#ccc' },
              ]}
              onPress={() => setProdutoId(item.id)}
            >
              <Text style={{ color: produtoId === item.id ? activeTheme.primary : '#555' }}>{item.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          {(['entrada', 'saida', 'ajuste'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[ui.chip, { borderColor: tipo === item ? activeTheme.primary : '#ccc' }]}
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
          placeholderTextColor="#8a8a8a"
          keyboardType="number-pad"
          style={ui.input}
          returnKeyType="next"
          blurOnSubmit={false}
        />
        <TextInput
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Motivo"
          placeholderTextColor="#8a8a8a"
          style={ui.input}
        />
        <TouchableOpacity style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]} onPress={registrarMovimento}>
          <Text style={ui.primaryText}>Registrar movimentacao</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 24 },
  section: { marginTop: 10, marginBottom: 6, fontWeight: '700', color: '#444' },
  alertCard: { marginRight: 8, minWidth: 180 },
  alertTitle: { fontWeight: '700', color: '#333' },
  row: { flexDirection: 'row', marginTop: 8 },
  inputSpacer: { marginTop: 10 },
  small: { color: '#666' },
});
