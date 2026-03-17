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
import { ui } from '../../src/ui/ui';

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
  const [busca, setBusca] = useState('');
  const [formVisivel, setFormVisivel] = useState(false);

  const tituloFormulario = useMemo(
    () => (editandoId ? 'Editar categoria' : 'Nova categoria'),
    [editandoId]
  );
  const categoriasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return categorias;
    return categorias.filter((item) => item.nome.toLowerCase().includes(term));
  }, [categorias, busca]);

  function resetForm() {
    setNome('');
    setDescricao('');
    setEditandoId(null);
    setFormVisivel(false);
  }

  function salvarCategoria() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }

    const nomeNormalizado = nome.trim();
    const descricaoNormalizada = descricao.trim();
    if (!nomeNormalizado) {
      Alert.alert('Validacao', 'Informe o nome da categoria.');
      return;
    }
    if (!descricaoNormalizada) {
      Alert.alert('Validacao', 'Informe a descricao da categoria.');
      return;
    }

    if (editandoId) {
      dispatch(
        updateCategoriaLocal({
          id: editandoId,
          usuario_id: activeUserId,
          nome: nomeNormalizado,
          descricao: descricaoNormalizada,
        })
      );

      dispatch(
        enqueueSyncItem({
          entity: 'categorias_produtos',
          endpoint: '/categorias/update.php',
          method: 'PUT',
          usuario_id: activeUserId,
          payload: {
            id: editandoId,
            usuario_id: activeUserId,
            nome: nomeNormalizado,
            descricao: descricaoNormalizada,
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
        usuario_id: activeUserId,
        nome: nomeNormalizado,
        descricao: descricaoNormalizada,
      })
    );

    dispatch(
      enqueueSyncItem({
        entity: 'categorias_produtos',
        endpoint: '/categorias/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          local_id: tempId,
          usuario_id: activeUserId,
          nome: nomeNormalizado,
          descricao: descricaoNormalizada,
        },
      })
    );

    resetForm();
  }

  function carregarParaEdicao(id: number, categoriaNome: string, categoriaDescricao?: string | null) {
    setFormVisivel(true);
    setEditandoId(id);
    setNome(categoriaNome);
    setDescricao(categoriaDescricao ?? '');
  }

  function excluirCategoria(id: number) {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }

    dispatch(removeCategoriaLocal({ id, usuario_id: activeUserId }));
    dispatch(
      enqueueSyncItem({
        entity: 'categorias_produtos',
        endpoint: '/categorias/delete.php',
        method: 'DELETE',
        usuario_id: activeUserId,
        payload: { id, usuario_id: activeUserId },
      })
    );
  }

  return (
    <View style={[ui.screen, { backgroundColor: activeTheme.background }]}>
      <Text style={[ui.title, { color: activeTheme.text }]}>Categorias de Produtos</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={() => {
            setFormVisivel((prev) => !prev);
            if (!formVisivel) setEditandoId(null);
          }}
        >
          <Text style={ui.primaryText}>{formVisivel ? 'Fechar formulario' : 'Nova categoria'}</Text>
        </TouchableOpacity>
      </View>

      {formVisivel ? (
        <View style={[ui.card, styles.formCard]}>
          <Text style={ui.sectionTitle}>{tituloFormulario}</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Nome da categoria"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <TextInput
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descricao"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <TouchableOpacity
            style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
            onPress={salvarCategoria}
          >
            <Text style={ui.primaryText}>{editandoId ? 'Atualizar' : 'Salvar'}</Text>
          </TouchableOpacity>
          {editandoId ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={resetForm}>
              <Text style={styles.secondaryBtnText}>Cancelar edicao</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder="Pesquisar categoria"
        placeholderTextColor="#8a8a8a"
        style={ui.searchInput}
      />

      <FlatList
        data={categoriasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={ui.empty}>Nenhuma categoria cadastrada.</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[ui.listCard, styles.itemCard, { backgroundColor: activeTheme.card }]}>
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
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  formCard: { marginBottom: 14 },
  secondaryBtn: { marginTop: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#666' },
  listContent: { paddingBottom: 24 },
  itemCard: {
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
