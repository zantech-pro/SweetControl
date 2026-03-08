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
  addCategoriaLocal,
  removeCategoriaLocal,
  updateCategoriaLocal,
} from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';

export default function Categorias() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const categorias = useSelector((state: RootState) =>
    state.referenceData.categorias.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const tituloFormulario = useMemo(
    () => (editandoId ? 'Editar categoria' : 'Nova categoria'),
    [editandoId]
  );

  function resetForm() {
    setNome('');
    setDescricao('');
    setEditandoId(null);
  }

  function salvarCategoria() {
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado) {
      Alert.alert('Validacao', 'Informe o nome da categoria.');
      return;
    }

    if (editandoId) {
      dispatch(
        updateCategoriaLocal({
          id: editandoId,
          usuario_id: activeUserId ?? 1,
          nome: nomeNormalizado,
          descricao: descricao.trim() || null,
        })
      );

      dispatch(
        enqueueSyncItem({
          entity: 'categorias_produtos',
          endpoint: '/categorias/update.php',
          method: 'PUT',
          usuario_id: activeUserId ?? 1,
          payload: {
            id: editandoId,
            usuario_id: activeUserId ?? 1,
            nome: nomeNormalizado,
            descricao: descricao.trim() || null,
          },
        })
      );

      resetForm();
      return;
    }

    const tempId = -Date.now();
    dispatch(
      addCategoriaLocal({
        id: tempId,
        usuario_id: activeUserId ?? 1,
        nome: nomeNormalizado,
        descricao: descricao.trim() || null,
      })
    );

    dispatch(
      enqueueSyncItem({
        entity: 'categorias_produtos',
        endpoint: '/categorias/create.php',
        method: 'POST',
        usuario_id: activeUserId ?? 1,
        payload: {
          usuario_id: activeUserId ?? 1,
          nome: nomeNormalizado,
          descricao: descricao.trim() || null,
        },
      })
    );

    resetForm();
  }

  function carregarParaEdicao(id: number, categoriaNome: string, categoriaDescricao?: string | null) {
    setEditandoId(id);
    setNome(categoriaNome);
    setDescricao(categoriaDescricao ?? '');
  }

  function excluirCategoria(id: number) {
    dispatch(removeCategoriaLocal({ id, usuario_id: activeUserId ?? 1 }));
    dispatch(
      enqueueSyncItem({
        entity: 'categorias_produtos',
        endpoint: '/categorias/delete.php',
        method: 'DELETE',
        usuario_id: activeUserId ?? 1,
        payload: { id, usuario_id: activeUserId ?? 1 },
      })
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.title, { color: activeTheme.text }]}>Categorias de Produtos</Text>

      <View style={[styles.formCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.formTitle}>{tituloFormulario}</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome da categoria"
          style={styles.input}
        />
        <TextInput
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descricao (opcional)"
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={salvarCategoria}
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
        data={categorias}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma categoria cadastrada.</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemNome, { color: activeTheme.text }]}>{item.nome}</Text>
              <Text style={styles.itemDescricao}>{item.descricao || 'Sem descricao'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => carregarParaEdicao(item.id, item.nome, item.descricao)}
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => excluirCategoria(item.id)}>
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
