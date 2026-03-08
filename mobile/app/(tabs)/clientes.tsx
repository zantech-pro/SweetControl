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
  addClienteLocal,
  removeClienteLocal,
  updateClienteLocal,
} from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';

export default function Clientes() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const clientes = useSelector((state: RootState) => state.referenceData.clientes);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const tituloFormulario = useMemo(
    () => (editandoId ? 'Editar cliente' : 'Novo cliente'),
    [editandoId]
  );

  function resetForm() {
    setNome('');
    setTelefone('');
    setEmail('');
    setEditandoId(null);
  }

  function validarEmail(value: string) {
    if (!value.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function salvarCliente() {
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado) {
      Alert.alert('Validacao', 'Informe o nome do cliente.');
      return;
    }
    if (!validarEmail(email)) {
      Alert.alert('Validacao', 'Email invalido.');
      return;
    }

    const telefoneNormalizado = telefone.trim() || null;
    const emailNormalizado = email.trim() || null;

    if (editandoId) {
      dispatch(
        updateClienteLocal({
          id: editandoId,
          nome: nomeNormalizado,
          telefone: telefoneNormalizado,
          email: emailNormalizado,
        })
      );

      dispatch(
        enqueueSyncItem({
          entity: 'clientes',
          endpoint: '/clientes/update.php',
          method: 'PUT',
          payload: {
            id: editandoId,
            nome: nomeNormalizado,
            telefone: telefoneNormalizado,
            email: emailNormalizado,
          },
        })
      );

      resetForm();
      return;
    }

    const tempId = -Date.now();
    dispatch(
      addClienteLocal({
        id: tempId,
        nome: nomeNormalizado,
        telefone: telefoneNormalizado,
        email: emailNormalizado,
      })
    );

    dispatch(
      enqueueSyncItem({
        entity: 'clientes',
        endpoint: '/clientes/create.php',
        method: 'POST',
        payload: {
          nome: nomeNormalizado,
          telefone: telefoneNormalizado,
          email: emailNormalizado,
        },
      })
    );

    resetForm();
  }

  function carregarCliente(
    id: number,
    clienteNome: string,
    clienteTelefone?: string | null,
    clienteEmail?: string | null
  ) {
    setEditandoId(id);
    setNome(clienteNome);
    setTelefone(clienteTelefone ?? '');
    setEmail(clienteEmail ?? '');
  }

  function excluirCliente(id: number) {
    dispatch(removeClienteLocal(id));
    dispatch(
      enqueueSyncItem({
        entity: 'clientes',
        endpoint: '/clientes/delete.php',
        method: 'DELETE',
        payload: { id },
      })
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.title, { color: activeTheme.text }]}>Clientes</Text>

      <View style={[styles.formCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.formTitle}>{tituloFormulario}</Text>
        <TextInput value={nome} onChangeText={setNome} placeholder="Nome" style={styles.input} />
        <TextInput
          value={telefone}
          onChangeText={setTelefone}
          placeholder="Telefone"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={salvarCliente}
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
        data={clientes}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum cliente cadastrado.</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemNome, { color: activeTheme.text }]}>{item.nome}</Text>
              <Text style={styles.itemDescricao}>Telefone: {item.telefone || '-'}</Text>
              <Text style={styles.itemDescricao}>Email: {item.email || '-'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => carregarCliente(item.id, item.nome, item.telefone, item.email)}
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => excluirCliente(item.id)}>
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

