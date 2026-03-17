import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import {
  addCompraLocal,
  addMovimentacaoEstoqueLocal,
  updateCompraStatusLocal,
} from '../../src/store/slices/businessSlice';
import { adjustProdutoEstoqueLocal } from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import { formatCurrencyBRL, maskCurrencyInputBRL, parseCurrencyInputBRL } from '../../src/utils/formatters';
import { ui } from '../../src/ui/ui';

type StatusCompra = 'pendente' | 'recebido';

export default function Compras() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const compras = useSelector((state: RootState) =>
    (state.business.compras ?? []).filter((item) => item.usuario_id === activeUserId)
  );
  const fornecedores = useSelector((state: RootState) =>
    state.referenceData.fornecedores.filter((item) => item.usuario_id === activeUserId)
  );
  const produtos = useSelector((state: RootState) =>
    state.referenceData.produtos.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [formVisivel, setFormVisivel] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscaFornecedor, setBuscaFornecedor] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [fornecedorId, setFornecedorId] = useState<number | null>(null);
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState('1');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [status, setStatus] = useState<StatusCompra>('pendente');
  const [numeroNota, setNumeroNota] = useState('');

  const fornecedoresFiltrados = useMemo(() => {
    const term = buscaFornecedor.trim().toLowerCase();
    if (!term) return fornecedores;
    return fornecedores.filter((item) => item.nome.toLowerCase().includes(term));
  }, [fornecedores, buscaFornecedor]);

  const produtosFiltrados = useMemo(() => {
    const term = buscaProduto.trim().toLowerCase();
    if (!term) return produtos;
    return produtos.filter((item) => item.nome.toLowerCase().includes(term));
  }, [produtos, buscaProduto]);

  const comprasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return compras;
    return compras.filter((item) =>
      `${item.fornecedor_nome} ${item.produto_nome} ${item.numero_nota ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [compras, busca]);

  const totalPreview = useMemo(() => {
    const qtd = Number(quantidade.replace(',', '.'));
    const custo = parseCurrencyInputBRL(custoUnitario);
    if (!Number.isFinite(qtd) || !Number.isFinite(custo)) return 0;
    return qtd * custo;
  }, [quantidade, custoUnitario]);

  function resetForm() {
    setFornecedorId(null);
    setProdutoId(null);
    setQuantidade('1');
    setCustoUnitario('');
    setStatus('pendente');
    setNumeroNota('');
    setBuscaFornecedor('');
    setBuscaProduto('');
    setFormVisivel(false);
  }

  function registrarMovimento(produtoIdLocal: number, quantidadeLocal: number, motivo: string) {
    if (!activeUserId) return;
    dispatch(
      adjustProdutoEstoqueLocal({
        id: produtoIdLocal,
        usuario_id: activeUserId,
        delta: quantidadeLocal,
      })
    );
    dispatch(
      addMovimentacaoEstoqueLocal({
        id: -Date.now(),
        usuario_id: activeUserId,
        produto_id: produtoIdLocal,
        produto_nome: produtos.find((item) => item.id === produtoIdLocal)?.nome ?? 'Produto',
        tipo_movimento: 'entrada',
        quantidade: quantidadeLocal,
        motivo,
        referencia_tipo: 'compra',
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
          produto_id: produtoIdLocal,
          tipo_movimento: 'entrada',
          quantidade: quantidadeLocal,
          motivo,
          referencia_tipo: 'compra',
        },
      })
    );
  }

  function adicionarCompra() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    if (!fornecedorId || !produtoId) {
      Alert.alert('Compra', 'Selecione fornecedor e produto.');
      return;
    }
    const qtd = Number(quantidade.replace(',', '.'));
    const custo = parseCurrencyInputBRL(custoUnitario);
    if (!Number.isFinite(qtd) || qtd <= 0 || !Number.isFinite(custo) || custo <= 0) {
      Alert.alert('Compra', 'Informe quantidade e custo validos.');
      return;
    }

    const fornecedor = fornecedores.find((item) => item.id === fornecedorId);
    const produto = produtos.find((item) => item.id === produtoId);
    const subtotal = qtd * custo;
    const compraId = -Date.now();
    const dataCompra = new Date().toISOString();

    dispatch(
      addCompraLocal({
        id: compraId,
        usuario_id: activeUserId,
        fornecedor_id: fornecedorId,
        fornecedor_nome: fornecedor?.nome ?? 'Fornecedor',
        produto_id: produtoId,
        produto_nome: produto?.nome ?? 'Produto',
        quantidade: qtd,
        custo_unitario: custo,
        subtotal,
        status,
        data_compra: dataCompra,
        numero_nota: numeroNota.trim() ? numeroNota.trim() : null,
      })
    );

    dispatch(
      enqueueSyncItem({
        entity: 'compras',
        endpoint: '/compras/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          local_id: compraId,
          fornecedor_id: fornecedorId,
          produto_id: produtoId,
          quantidade: qtd,
          custo_unitario: custo,
          total_compra: subtotal,
          status,
          data_compra: dataCompra.slice(0, 10),
          numero_nota: numeroNota.trim() || null,
        },
      })
    );

    if (status === 'recebido') {
      registrarMovimento(produtoId, qtd, 'Compra recebida');
    }

    resetForm();
  }

  function receberCompra(id: number) {
    if (!activeUserId) return;
    const compra = compras.find((item) => item.id === id);
    if (!compra || compra.status === 'recebido') return;

    dispatch(
      updateCompraStatusLocal({
        id,
        usuario_id: activeUserId,
        status: 'recebido',
      })
    );
    registrarMovimento(compra.produto_id, compra.quantidade, 'Compra recebida');
    dispatch(
      enqueueSyncItem({
        entity: 'compras',
        endpoint: '/compras/update-status.php',
        method: 'PUT',
        usuario_id: activeUserId,
        payload: {
          id,
          status: 'recebido',
        },
      })
    );
  }

  return (
    <View style={[ui.screen, { backgroundColor: activeTheme.background }]}>
      <Text style={[ui.title, { color: activeTheme.text }]}>Compras</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={() => setFormVisivel((prev) => !prev)}
        >
          <Text style={styles.primaryBtnText}>
            {formVisivel ? 'Fechar formulario' : 'Nova compra'}
          </Text>
        </TouchableOpacity>
      </View>

      {formVisivel ? (
        <View style={[ui.card, styles.formCard]}>
          <Text style={ui.sectionTitle}>Registrar compra</Text>

          <Text style={ui.sectionTitle}>Fornecedor</Text>
          <TextInput
            value={buscaFornecedor}
            onChangeText={setBuscaFornecedor}
            placeholder="Buscar fornecedor"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <View style={ui.row}>
            {fornecedoresFiltrados.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  ui.chip,
                  { borderColor: fornecedorId === item.id ? activeTheme.primary : '#ccc' },
                ]}
                onPress={() => setFornecedorId(item.id)}
              >
                <Text style={{ color: fornecedorId === item.id ? activeTheme.primary : '#555' }}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ui.sectionTitle}>Produto</Text>
          <TextInput
            value={buscaProduto}
            onChangeText={setBuscaProduto}
            placeholder="Buscar produto"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <View style={ui.row}>
            {produtosFiltrados.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  ui.chip,
                  { borderColor: produtoId === item.id ? activeTheme.primary : '#ccc' },
                ]}
                onPress={() => setProdutoId(item.id)}
              >
                <Text style={{ color: produtoId === item.id ? activeTheme.primary : '#555' }}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={quantidade}
            onChangeText={setQuantidade}
            placeholder="Quantidade"
            placeholderTextColor="#8a8a8a"
            keyboardType="numeric"
            style={ui.input}
          />
          <TextInput
            value={custoUnitario}
            onChangeText={(value) => setCustoUnitario(maskCurrencyInputBRL(value))}
            placeholder="Custo unitario"
            placeholderTextColor="#8a8a8a"
            keyboardType="decimal-pad"
            style={ui.input}
          />
          <TextInput
            value={numeroNota}
            onChangeText={setNumeroNota}
            placeholder="Numero da nota / observacao"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />

          <Text style={ui.sectionTitle}>Status</Text>
          <View style={ui.row}>
            {(['pendente', 'recebido'] as StatusCompra[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  ui.chip,
                  { borderColor: status === item ? activeTheme.primary : '#ccc' },
                ]}
                onPress={() => setStatus(item)}
              >
                <Text style={{ color: status === item ? activeTheme.primary : '#555' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.totalText}>Total: {formatCurrencyBRL(totalPreview)}</Text>

          <TouchableOpacity
            style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
            onPress={adicionarCompra}
          >
            <Text style={ui.primaryText}>Salvar compra</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder="Pesquisar compra"
        placeholderTextColor="#8a8a8a"
        style={ui.searchInput}
      />

      <FlatList
        data={comprasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={ui.empty}>Nenhuma compra registrada.</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[ui.listCard, styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: activeTheme.text }]}>
                {item.fornecedor_nome}
              </Text>
              <Text style={styles.itemDescricao}>{item.produto_nome}</Text>
              <Text style={styles.itemDescricao}>
                Qtd: {item.quantidade} | Custo: {formatCurrencyBRL(item.custo_unitario)}
              </Text>
              <Text style={styles.itemDescricao}>
                Status: {item.status} | Total: {formatCurrencyBRL(item.subtotal)}
              </Text>
              {item.numero_nota ? (
                <Text style={styles.itemDescricao}>Nota/Obs: {item.numero_nota}</Text>
              ) : null}
            </View>
            {item.status === 'pendente' ? (
              <TouchableOpacity
                style={[styles.itemBtn, { backgroundColor: '#2e7d32' }]}
                onPress={() => receberCompra(item.id)}
              >
                <Text style={styles.itemBtnText}>Receber</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  formCard: { marginBottom: 14 },
  totalText: { marginTop: 6, fontWeight: '700', color: '#1e88e5' },
  listContent: { paddingBottom: 24 },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  itemDescricao: { marginTop: 4, color: '#666' },
  itemBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  itemBtnText: { color: '#fff', fontWeight: '700' },
});
