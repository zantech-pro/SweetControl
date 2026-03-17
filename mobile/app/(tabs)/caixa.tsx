import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import {
  addVendaLocal,
  MetodoPagamento,
  addMovimentacaoEstoqueLocal,
  updatePedidoOnlineStatusLocal,
} from '../../src/store/slices/businessSlice';
import { adjustProdutoEstoqueLocal } from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import {
  formatCurrencyBRL,
  maskCurrencyInputBRL,
  parseCurrencyInputBRL,
} from '../../src/utils/formatters';
import { ui } from '../../src/ui/ui';

type CartItem = { produto_id: number; nome: string; preco: number; quantidade: number };

export default function Caixa() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const categorias = useSelector((state: RootState) =>
    state.referenceData.categorias.filter((item) => item.usuario_id === activeUserId)
  );
  const produtos = useSelector((state: RootState) =>
    state.referenceData.produtos.filter((item) => item.usuario_id === activeUserId && item.quantidade_estoque > 0)
  );
  const clientes = useSelector((state: RootState) =>
    state.referenceData.clientes.filter((item) => item.usuario_id === activeUserId)
  );
  const pedidosOnline = useSelector((state: RootState) =>
    state.business.pedidosOnline.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;
  const { width } = useWindowDimensions();
  const productColumns = width >= 360 ? 2 : 1;
  const screenPadding = 16;
  const productGap = 10;
  const productCardWidth =
    productColumns === 1
      ? width - screenPadding * 2
      : (width - screenPadding * 2 - productGap) / 2;

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clientesVisiveis, setClientesVisiveis] = useState(true);
  const [produtosVisiveis, setProdutosVisiveis] = useState(true);
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix');
  const [desconto, setDesconto] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ultimoRecibo, setUltimoRecibo] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [produtoSearch, setProdutoSearch] = useState('');

  const totalBruto = useMemo(
    () => cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0),
    [cart]
  );
  const descontoValor = useMemo(() => parseCurrencyInputBRL(desconto), [desconto]);
  const totalLiquido = useMemo(() => Math.max(totalBruto - descontoValor, 0), [totalBruto, descontoValor]);
  const produtosPorCategoria = useMemo(() => {
    if (selectedCategoryIds.length === 0) return produtos;
    return produtos.filter((item) => {
      const categoriaId = item.categoria_id ?? null;
      return categoriaId !== null && selectedCategoryIds.includes(categoriaId);
    });
  }, [produtos, selectedCategoryIds]);
  const clientesFiltrados = useMemo(() => {
    const term = clienteSearch.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((item) => item.nome.toLowerCase().includes(term));
  }, [clientes, clienteSearch]);
  const produtosFiltrados = useMemo(() => {
    const term = produtoSearch.trim().toLowerCase();
    if (!term) return produtosPorCategoria;
    return produtosPorCategoria.filter((item) => item.nome.toLowerCase().includes(term));
  }, [produtosPorCategoria, produtoSearch]);

  function toggleCategoriaFiltro(categoriaId: number) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoriaId) ? prev.filter((id) => id !== categoriaId) : [...prev, categoriaId]
    );
  }

  function addProduto(produtoId: number) {
    const produto = produtosPorCategoria.find((item) => item.id === produtoId);
    if (!produto) return;

    const preco = Number(produto.preco_venda ?? 0);
    if (preco <= 0) {
      Alert.alert('Preco invalido', 'Defina preco de venda do produto antes de vender.');
      return;
    }

    setCart((prev) => {
      const found = prev.find((item) => item.produto_id === produtoId);
      if (!found) {
        return [...prev, { produto_id: produtoId, nome: produto.nome, preco, quantidade: 1 }];
      }
      return prev.map((item) =>
        item.produto_id === produtoId ? { ...item, quantidade: item.quantidade + 1 } : item
      );
    });
    setProdutosVisiveis(false);
  }

  function alterarQtd(produtoId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.produto_id === produtoId ? { ...item, quantidade: Math.max(item.quantidade + delta, 0) } : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  React.useEffect(() => {
    if (cart.length === 0) {
      setProdutosVisiveis(true);
    }
  }, [cart.length]);

  function finalizarVenda() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    if (!cart.length) {
      Alert.alert('Carrinho vazio', 'Adicione pelo menos um produto.');
      return;
    }

    const vendaId = -Date.now();
    const cliente = clientes.find((item) => item.id === clienteId) ?? null;
    const itens = cart.map((item) => ({
      produto_id: item.produto_id,
      nome_produto: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      subtotal: item.preco * item.quantidade,
    }));

    dispatch(
      addVendaLocal({
        id: vendaId,
        usuario_id: activeUserId,
        cliente_id: clienteId,
        cliente_nome: cliente?.nome ?? null,
        itens,
        total_bruto: totalBruto,
        desconto: descontoValor,
        total_liquido: totalLiquido,
        metodo_pagamento: metodo,
        status_venda: 'pago',
        data_venda: new Date().toISOString(),
        status_sincronizacao: 'offline',
      })
    );

    dispatch(
      enqueueSyncItem({
        entity: 'vendas',
        endpoint: '/vendas/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          local_id: vendaId,
          usuario_id: activeUserId,
          cliente_id: clienteId,
          total_bruto: totalBruto,
          desconto: descontoValor,
          total_liquido: totalLiquido,
          metodo_pagamento: metodo,
          status_sincronizacao: 'offline',
        },
      })
    );

    cart.forEach((item) => {
      dispatch(
        adjustProdutoEstoqueLocal({
          id: item.produto_id,
          usuario_id: activeUserId,
          delta: -item.quantidade,
        })
      );
      dispatch(
        addMovimentacaoEstoqueLocal({
          id: -(Date.now() + item.produto_id),
          usuario_id: activeUserId,
          produto_id: item.produto_id,
          produto_nome: item.nome,
          tipo_movimento: 'saida',
          quantidade: item.quantidade,
          motivo: 'Venda realizada',
          referencia_tipo: 'venda',
          referencia_id: vendaId,
          data_movimento: new Date().toISOString(),
        })
      );

      dispatch(
        enqueueSyncItem({
          entity: 'itens_venda',
          endpoint: '/vendas/itens/create.php',
          method: 'POST',
          usuario_id: activeUserId,
          payload: {
            venda_id: vendaId,
            usuario_id: activeUserId,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco,
            subtotal: item.preco * item.quantidade,
          },
        })
      );
      dispatch(
        enqueueSyncItem({
          entity: 'movimentacoes_estoque',
          endpoint: '/estoque/movimentacoes/create.php',
          method: 'POST',
          usuario_id: activeUserId,
          payload: {
            produto_id: item.produto_id,
            usuario_id: activeUserId,
            tipo_movimento: 'saida',
            quantidade: item.quantidade,
            motivo: 'Venda',
            referencia_tipo: 'venda',
            referencia_id: vendaId,
          },
        })
      );
    });

    const reciboTexto = [
      'Recibo SweetControl',
      `Data: ${new Date().toLocaleString()}`,
      `Cliente: ${cliente?.nome ?? 'Consumidor final'}`,
      ...itens.map((item) => `${item.nome_produto} x${item.quantidade} = R$ ${item.subtotal.toFixed(2)}`),
      `Total bruto: ${formatCurrencyBRL(totalBruto)}`,
      `Desconto: ${formatCurrencyBRL(descontoValor)}`,
      `Total liquido: ${formatCurrencyBRL(totalLiquido)}`,
      `Pagamento: ${metodo}`,
    ].join('\n');
    setUltimoRecibo(reciboTexto);

    setCart([]);
    setDesconto('');
    Alert.alert('Sucesso', 'Venda registrada offline e enviada para fila de sincronizacao.');
  }

  async function compartilharRecibo() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    if (!ultimoRecibo) return;
    await Share.share({ message: ultimoRecibo });
    dispatch(
      enqueueSyncItem({
        entity: 'recibos_digitais',
        endpoint: '/vendas/recibos/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          usuario_id: activeUserId,
          conteudo: ultimoRecibo,
          gerado_em: new Date().toISOString(),
        },
      })
    );
  }

  return (
    <KeyboardAvoidingView
      style={[ui.screen, { backgroundColor: activeTheme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <Text style={[ui.title, { color: activeTheme.text }]}>Frente de Caixa</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Cliente: {clienteId === null ? 'Sem cliente' : clientes.find((c) => c.id === clienteId)?.nome ?? '-'}
        </Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => setClientesVisiveis((prev) => !prev)}
        >
          <Text style={styles.linkText}>{clientesVisiveis ? 'Ocultar' : 'Trocar'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={clienteSearch}
        onChangeText={setClienteSearch}
        placeholder="Pesquisar cliente"
        placeholderTextColor="#8a8a8a"
        style={ui.searchInput}
      />
      {clientesVisiveis ? (
        <FlatList
          data={[{ id: 0, nome: 'Sem cliente' }, ...clientesFiltrados]}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.gridList}
          columnWrapperStyle={styles.gridRow}
          numColumns={2}
          renderItem={({ item }) => {
            const idAtual = item.id === 0 ? null : item.id;
            const selected = clienteId === idAtual;
            return (
              <TouchableOpacity
                style={[
                  ui.chip,
                  styles.gridItem,
                  { borderColor: selected ? activeTheme.primary : '#ccc' },
                ]}
                onPress={() => {
                  setClienteId(idAtual);
                  setClientesVisiveis(false);
                }}
              >
                <Text style={{ color: selected ? activeTheme.primary : '#555' }}>{item.nome}</Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Produtos</Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => setProdutosVisiveis((prev) => !prev)}
        >
          <Text style={styles.linkText}>{produtosVisiveis ? 'Ocultar' : 'Adicionar mais'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={produtoSearch}
        onChangeText={setProdutoSearch}
        placeholder="Pesquisar produto"
        placeholderTextColor="#8a8a8a"
        style={ui.searchInput}
      />
      {produtosVisiveis ? (
        <>
          <FlatList
            horizontal
            data={categorias}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.horizontalList}
            ListHeaderComponent={
              <TouchableOpacity
                style={[
                  ui.chip,
                  { borderColor: selectedCategoryIds.length === 0 ? activeTheme.primary : '#ccc' },
                ]}
                onPress={() => setSelectedCategoryIds([])}
              >
                <Text style={{ color: selectedCategoryIds.length === 0 ? activeTheme.primary : '#555' }}>
                  Todas
                </Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => {
              const selected = selectedCategoryIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[ui.chip, { borderColor: selected ? activeTheme.primary : '#ccc' }]}
                  onPress={() => toggleCategoriaFiltro(item.id)}
                >
                  <Text style={{ color: selected ? activeTheme.primary : '#555' }}>{item.nome}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <FlatList
            data={produtosFiltrados}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.gridList}
            columnWrapperStyle={productColumns > 1 ? styles.gridRow : undefined}
            numColumns={productColumns}
            ListEmptyComponent={<Text style={styles.smallText}>Nenhum produto nesta(s) categoria(s).</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  ui.listCard,
                  styles.productCard,
                  productColumns === 1 ? styles.productCardSingle : styles.productCardGrid,
                  { width: productCardWidth },
                  { backgroundColor: activeTheme.card },
                ]}
                onPress={() => addProduto(item.id)}
              >
                <Text
                  style={[styles.productTitle, { color: activeTheme.text }]}
                  numberOfLines={2}
                >
                  {item.nome}
                </Text>
                <Text style={styles.productPrice}>{formatCurrencyBRL(item.preco_venda ?? 0)}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Carrinho</Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.produto_id.toString()}
        ListEmptyComponent={<Text style={styles.smallText}>Nenhum item adicionado.</Text>}
        renderItem={({ item }) => (
          <View style={[ui.listCard, styles.cartItem, { backgroundColor: activeTheme.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: activeTheme.text, fontWeight: '700' }}>{item.nome}</Text>
              <Text style={styles.smallText}>Subtotal: {formatCurrencyBRL(item.preco * item.quantidade)}</Text>
            </View>
            <View style={styles.qtyActions}>
              <TouchableOpacity onPress={() => alterarQtd(item.produto_id, -1)}>
                <Text style={styles.actionText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantidade}</Text>
              <TouchableOpacity onPress={() => alterarQtd(item.produto_id, 1)}>
                <Text style={styles.actionText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TextInput
        value={desconto}
        onChangeText={(value) => setDesconto(maskCurrencyInputBRL(value))}
        placeholder="Desconto (R$ 0,00)"
        placeholderTextColor="#8a8a8a"
        keyboardType="decimal-pad"
        style={ui.input}
      />
      <View style={styles.paymentRow}>
        {(['pix', 'dinheiro', 'cartao', 'transferencia'] as MetodoPagamento[]).map((item) => (
          <TouchableOpacity
            key={item}
            style={[ui.chip, { borderColor: metodo === item ? activeTheme.primary : '#ccc' }]}
            onPress={() => setMetodo(item)}
          >
            <Text style={{ color: metodo === item ? activeTheme.primary : '#555' }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.total}>Total bruto: {formatCurrencyBRL(totalBruto)}</Text>
      <Text style={styles.total}>Total liquido: {formatCurrencyBRL(totalLiquido)}</Text>

      <TouchableOpacity style={[ui.primaryBtn, styles.finalizarBtn, { backgroundColor: activeTheme.primary }]} onPress={finalizarVenda}>
        <Text style={ui.primaryText}>Registrar Venda</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[ui.primaryBtn, styles.finalizarBtn, { backgroundColor: '#6d4c41' }]} onPress={compartilharRecibo}>
        <Text style={ui.primaryText}>Compartilhar Recibo Digital</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Pedidos Online</Text>
      <FlatList
        data={pedidosOnline}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[ui.listCard, styles.cartItem, { backgroundColor: activeTheme.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: activeTheme.text, fontWeight: '700' }}>{item.cliente_nome}</Text>
              <Text style={styles.smallText}>{item.itens_resumo}</Text>
              <Text style={styles.smallText}>{formatCurrencyBRL(item.valor_total)} | {item.status}</Text>
            </View>
            <View>
              <TouchableOpacity
                onPress={() => {
                  if (!activeUserId) {
                    Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
                    return;
                  }
                  dispatch(
                    updatePedidoOnlineStatusLocal({
                      id: item.id,
                      usuario_id: activeUserId,
                      status: 'aceito',
                    })
                  );
                }}
              >
                <Text style={styles.actionText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: 10, marginBottom: 6, fontWeight: '700', color: '#444' },
  sectionHeader: { marginTop: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  linkText: { color: '#1e88e5', fontWeight: '600' },
  horizontalList: { paddingBottom: 6 },
  productCard: { justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10 },
  productCardGrid: { minHeight: 96 },
  productCardSingle: { minHeight: 84 },
  productTitle: { fontWeight: '700', fontSize: 14, lineHeight: 17 },
  productPrice: { color: '#666', marginTop: 2, fontSize: 12 },
  gridList: { paddingBottom: 6 },
  gridRow: { justifyContent: 'space-between', marginBottom: 10 },
  gridItem: { flex: 1, marginRight: 0, minHeight: 90 },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyActions: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 22, fontWeight: '700', color: '#1e88e5' },
  qtyText: { fontWeight: '700', minWidth: 24, textAlign: 'center' },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  total: { marginTop: 6, fontWeight: '700', color: '#333' },
  finalizarBtn: { marginTop: 12 },
  smallText: { color: '#666' },
});
