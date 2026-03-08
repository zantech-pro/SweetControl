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
  addProdutoLocal,
  removeProdutoLocal,
  updateProdutoLocal,
} from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';

export default function Produtos() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const produtos = useSelector((state: RootState) =>
    state.referenceData.produtos.filter((item) => item.usuario_id === activeUserId)
  );
  const categorias = useSelector((state: RootState) =>
    state.referenceData.categorias.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [nome, setNome] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const tituloFormulario = useMemo(
    () => (editandoId ? 'Editar produto' : 'Novo produto'),
    [editandoId]
  );

  function resetForm() {
    setNome('');
    setPrecoVenda('');
    setQuantidadeEstoque('');
    setEstoqueMinimo('');
    setDataValidade('');
    setCategoriaId(null);
    setEditandoId(null);
  }

  function salvarProduto() {
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado) {
      Alert.alert('Validacao', 'Informe o nome do produto.');
      return;
    }

    const preco = precoVenda.trim() ? Number(precoVenda.replace(',', '.')) : null;
    const estoque = quantidadeEstoque.trim() ? Number(quantidadeEstoque) : null;
    const minimo = estoqueMinimo.trim() ? Number(estoqueMinimo) : null;

    if (preco !== null && Number.isNaN(preco)) {
      Alert.alert('Validacao', 'Preco de venda invalido.');
      return;
    }
    if (estoque !== null && Number.isNaN(estoque)) {
      Alert.alert('Validacao', 'Quantidade de estoque invalida.');
      return;
    }
    if (minimo !== null && Number.isNaN(minimo)) {
      Alert.alert('Validacao', 'Estoque minimo invalido.');
      return;
    }

    if (editandoId) {
      dispatch(
        updateProdutoLocal({
          id: editandoId,
          usuario_id: activeUserId ?? 1,
          nome: nomeNormalizado,
          categoria_id: categoriaId,
          preco_venda: preco,
          quantidade_estoque: estoque,
          estoque_minimo: minimo,
          data_validade: dataValidade.trim() || null,
        })
      );

      dispatch(
        enqueueSyncItem({
          entity: 'produtos',
          endpoint: '/produtos/update.php',
          method: 'PUT',
          usuario_id: activeUserId ?? 1,
          payload: {
            id: editandoId,
            usuario_id: activeUserId ?? 1,
            nome: nomeNormalizado,
            categoria_id: categoriaId,
            preco_venda: preco,
            quantidade_estoque: estoque,
            estoque_minimo: minimo,
            data_validade: dataValidade.trim() || null,
          },
        })
      );

      resetForm();
      return;
    }

    const tempId = -Date.now();
    dispatch(
      addProdutoLocal({
        id: tempId,
        usuario_id: activeUserId ?? 1,
        nome: nomeNormalizado,
        categoria_id: categoriaId,
        preco_venda: preco,
        quantidade_estoque: estoque,
        estoque_minimo: minimo,
        data_validade: dataValidade.trim() || null,
        status: 'ativo',
      })
    );

    dispatch(
      enqueueSyncItem({
        entity: 'produtos',
        endpoint: '/produtos/create.php',
        method: 'POST',
        usuario_id: activeUserId ?? 1,
        payload: {
          usuario_id: activeUserId ?? 1,
          nome: nomeNormalizado,
          categoria_id: categoriaId,
          preco_venda: preco,
          quantidade_estoque: estoque,
          estoque_minimo: minimo,
          data_validade: dataValidade.trim() || null,
          status: 'ativo',
        },
      })
    );

    resetForm();
  }

  function carregarProduto(
    id: number,
    produtoNome: string,
    produtoPreco?: number | null,
    produtoQtd?: number | null,
    produtoCategoriaId?: number | null,
    produtoEstoqueMinimo?: number | null,
    produtoDataValidade?: string | null
  ) {
    setEditandoId(id);
    setNome(produtoNome);
    setPrecoVenda(produtoPreco?.toString() ?? '');
    setQuantidadeEstoque(produtoQtd?.toString() ?? '');
    setCategoriaId(produtoCategoriaId ?? null);
    setEstoqueMinimo(produtoEstoqueMinimo?.toString() ?? '');
    setDataValidade(produtoDataValidade ?? '');
  }

  function excluirProduto(id: number) {
    dispatch(removeProdutoLocal({ id, usuario_id: activeUserId ?? 1 }));
    dispatch(
      enqueueSyncItem({
        entity: 'produtos',
        endpoint: '/produtos/delete.php',
        method: 'DELETE',
        usuario_id: activeUserId ?? 1,
        payload: { id, usuario_id: activeUserId ?? 1 },
      })
    );
  }

  function categoriaNome(categoriaIdItem?: number | null) {
    if (!categoriaIdItem) return 'Sem categoria';
    return categorias.find((item) => item.id === categoriaIdItem)?.nome ?? 'Categoria removida';
  }

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.title, { color: activeTheme.text }]}>Produtos</Text>

      <View style={[styles.formCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.formTitle}>{tituloFormulario}</Text>
        <TextInput value={nome} onChangeText={setNome} placeholder="Nome do produto" style={styles.input} />
        <TextInput
          value={precoVenda}
          onChangeText={setPrecoVenda}
          placeholder="Preco de venda (ex: 29.90)"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <TextInput
          value={quantidadeEstoque}
          onChangeText={setQuantidadeEstoque}
          placeholder="Quantidade em estoque"
          keyboardType="number-pad"
          style={styles.input}
        />
        <TextInput
          value={estoqueMinimo}
          onChangeText={setEstoqueMinimo}
          placeholder="Estoque minimo"
          keyboardType="number-pad"
          style={styles.input}
        />
        <TextInput
          value={dataValidade}
          onChangeText={setDataValidade}
          placeholder="Validade (YYYY-MM-DD)"
          style={styles.input}
        />

        <Text style={styles.label}>Categoria</Text>
        <FlatList
          horizontal
          data={[{ id: 0, nome: 'Sem categoria' }, ...categorias]}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const idAtual = item.id === 0 ? null : item.id;
            const selected = categoriaId === idAtual;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  { borderColor: selected ? activeTheme.primary : '#d9d9d9' },
                ]}
                onPress={() => setCategoriaId(idAtual)}
              >
                <Text style={{ color: selected ? activeTheme.primary : '#666' }}>{item.nome}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={salvarProduto}
        >
          <Text style={styles.primaryBtnText}>{editandoId ? 'Atualizar' : 'Salvar'}</Text>
        </TouchableOpacity>
        {editandoId ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={resetForm}>
            <Text style={styles.secondaryBtnText}>Cancelar edicao</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum produto cadastrado.</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemNome, { color: activeTheme.text }]}>{item.nome}</Text>
              <Text style={styles.itemDescricao}>Categoria: {categoriaNome(item.categoria_id)}</Text>
              <Text style={styles.itemDescricao}>Preco: R$ {item.preco_venda ?? 0}</Text>
              <Text style={styles.itemDescricao}>Estoque: {item.quantidade_estoque ?? 0}</Text>
              <Text style={styles.itemDescricao}>Minimo: {item.estoque_minimo ?? 0}</Text>
              <Text style={styles.itemDescricao}>
                Validade: {item.data_validade || 'Nao informada'}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  carregarProduto(
                    item.id,
                    item.nome,
                    item.preco_venda,
                    item.quantidade_estoque,
                    item.categoria_id,
                    item.estoque_minimo,
                    item.data_validade
                  )
                }
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => excluirProduto(item.id)}>
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  formCard: { borderRadius: 12, padding: 14, marginBottom: 14 },
  formTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  label: { marginBottom: 8, color: '#444', fontWeight: '600' },
  categoryList: { paddingBottom: 10 },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  primaryBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { marginTop: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#666' },
  listContent: { paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#777', marginTop: 20 },
  itemCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemNome: { fontSize: 16, fontWeight: '700' },
  itemDescricao: { marginTop: 4, color: '#666' },
  actions: { flexDirection: 'row' },
  actionBtn: { marginLeft: 12 },
  editText: { color: '#1e88e5', fontWeight: '600' },
  deleteText: { color: '#e53935', fontWeight: '600' },
});
