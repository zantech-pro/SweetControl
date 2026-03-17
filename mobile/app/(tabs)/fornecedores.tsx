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
  addFornecedorLocal,
  removeFornecedorLocal,
  updateFornecedorLocal,
} from '../../src/store/slices/referenceDataSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import {
  isValidEmail,
  isValidPhoneBR,
  maskPhoneBR,
  normalizeEmail,
} from '../../src/utils/formatters';
import { ui } from '../../src/ui/ui';

export default function Fornecedores() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const fornecedores = useSelector((state: RootState) =>
    state.referenceData.fornecedores.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [formVisivel, setFormVisivel] = useState(false);

  const tituloFormulario = useMemo(
    () => (editandoId ? 'Editar fornecedor' : 'Novo fornecedor'),
    [editandoId]
  );
  const fornecedoresFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return fornecedores;
    return fornecedores.filter((item) => item.nome.toLowerCase().includes(term));
  }, [fornecedores, busca]);

  function resetForm() {
    setNome('');
    setContato('');
    setTelefone('');
    setEmail('');
    setPrazoEntrega('');
    setObservacoes('');
    setEditandoId(null);
    setFormVisivel(false);
  }

  function salvarFornecedor() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }

    const nomeNormalizado = nome.trim();
    const contatoNormalizado = contato.trim();
    const telefoneNormalizado = maskPhoneBR(telefone);
    const emailNormalizado = normalizeEmail(email);
    const prazo = prazoEntrega.trim() ? Number(prazoEntrega) : null;

    if (!nomeNormalizado) {
      Alert.alert('Validacao', 'Informe o nome do fornecedor.');
      return;
    }
    if (telefoneNormalizado && !isValidPhoneBR(telefoneNormalizado)) {
      Alert.alert('Validacao', 'Telefone invalido. Use DDD + numero.');
      return;
    }
    if (emailNormalizado && !isValidEmail(emailNormalizado)) {
      Alert.alert('Validacao', 'Email invalido. Ex: nome@email.com');
      return;
    }
    if (prazo !== null && Number.isNaN(prazo)) {
      Alert.alert('Validacao', 'Prazo de entrega invalido.');
      return;
    }

    if (editandoId) {
      dispatch(
        updateFornecedorLocal({
          id: editandoId,
          usuario_id: activeUserId,
          nome: nomeNormalizado,
          contato: contatoNormalizado || null,
          telefone: telefoneNormalizado ? telefoneNormalizado.trim() : null,
          email: emailNormalizado || null,
          prazo_entrega_dias: prazo,
          observacoes: observacoes.trim() || null,
        })
      );

      dispatch(
        enqueueSyncItem({
          entity: 'fornecedores',
          endpoint: '/fornecedores/update.php',
          method: 'PUT',
          usuario_id: activeUserId,
          payload: {
            id: editandoId,
            usuario_id: activeUserId,
            nome: nomeNormalizado,
            contato: contatoNormalizado || null,
            telefone: telefoneNormalizado ? telefoneNormalizado.trim() : null,
            email: emailNormalizado || null,
            prazo_entrega_dias: prazo,
            observacoes: observacoes.trim() || null,
          },
        })
      );

      resetForm();
      return;
    }

    const tempId = -Date.now();
    dispatch(
      addFornecedorLocal({
        id: tempId,
        usuario_id: activeUserId,
        nome: nomeNormalizado,
        contato: contatoNormalizado || null,
        telefone: telefoneNormalizado ? telefoneNormalizado.trim() : null,
        email: emailNormalizado || null,
        prazo_entrega_dias: prazo,
        observacoes: observacoes.trim() || null,
      })
    );

    dispatch(
      enqueueSyncItem({
        entity: 'fornecedores',
        endpoint: '/fornecedores/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          local_id: tempId,
          usuario_id: activeUserId,
          nome: nomeNormalizado,
          contato: contatoNormalizado || null,
          telefone: telefoneNormalizado ? telefoneNormalizado.trim() : null,
          email: emailNormalizado || null,
          prazo_entrega_dias: prazo,
          observacoes: observacoes.trim() || null,
        },
      })
    );

    resetForm();
  }

  function carregarFornecedor(
    id: number,
    fornecedorNome: string,
    fornecedorContato?: string | null,
    fornecedorTelefone?: string | null,
    fornecedorEmail?: string | null,
    fornecedorPrazo?: number | null,
    fornecedorObs?: string | null
  ) {
    setFormVisivel(true);
    setEditandoId(id);
    setNome(fornecedorNome);
    setContato(fornecedorContato ?? '');
    setTelefone(fornecedorTelefone ?? '');
    setEmail(fornecedorEmail ?? '');
    setPrazoEntrega(fornecedorPrazo?.toString() ?? '');
    setObservacoes(fornecedorObs ?? '');
  }

  function excluirFornecedor(id: number) {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }

    dispatch(removeFornecedorLocal({ id, usuario_id: activeUserId }));
    dispatch(
      enqueueSyncItem({
        entity: 'fornecedores',
        endpoint: '/fornecedores/delete.php',
        method: 'DELETE',
        usuario_id: activeUserId,
        payload: { id, usuario_id: activeUserId },
      })
    );
  }

  return (
    <View style={[ui.screen, { backgroundColor: activeTheme.background }]}>
      <Text style={[ui.title, { color: activeTheme.text }]}>Fornecedores</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={() => {
            setFormVisivel((prev) => !prev);
            if (!formVisivel) setEditandoId(null);
          }}
        >
          <Text style={ui.primaryText}>{formVisivel ? 'Fechar formulario' : 'Novo fornecedor'}</Text>
        </TouchableOpacity>
      </View>

      {formVisivel ? (
        <View style={[ui.card, styles.formCard]}>
          <Text style={ui.sectionTitle}>{tituloFormulario}</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Nome"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <TextInput
            value={contato}
            onChangeText={setContato}
            placeholder="Contato"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <TextInput
            value={telefone}
            onChangeText={(value) => setTelefone(maskPhoneBR(value))}
            placeholder="Telefone"
            placeholderTextColor="#8a8a8a"
            keyboardType="phone-pad"
            style={ui.input}
          />
          <TextInput
            value={email}
            onChangeText={(value) => setEmail(normalizeEmail(value))}
            placeholder="Email"
            placeholderTextColor="#8a8a8a"
            keyboardType="email-address"
            autoCapitalize="none"
            style={ui.input}
          />
          <TextInput
            value={prazoEntrega}
            onChangeText={setPrazoEntrega}
            placeholder="Prazo entrega (dias)"
            placeholderTextColor="#8a8a8a"
            keyboardType="number-pad"
            style={ui.input}
          />
          <TextInput
            value={observacoes}
            onChangeText={setObservacoes}
            placeholder="Observacoes"
            placeholderTextColor="#8a8a8a"
            style={[ui.input, styles.textArea]}
            multiline
          />

          <TouchableOpacity
            style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
            onPress={salvarFornecedor}
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
        placeholder="Pesquisar fornecedor"
        placeholderTextColor="#8a8a8a"
        style={ui.searchInput}
      />

      <FlatList
        data={fornecedoresFiltrados}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={ui.empty}>Nenhum fornecedor cadastrado.</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[ui.listCard, styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemNome, { color: activeTheme.text }]}>{item.nome}</Text>
              <Text style={styles.itemDescricao}>Contato: {item.contato || '-'}</Text>
              <Text style={styles.itemDescricao}>Telefone: {item.telefone || '-'}</Text>
              <Text style={styles.itemDescricao}>Email: {item.email || '-'}</Text>
              <Text style={styles.itemDescricao}>
                Prazo entrega: {item.prazo_entrega_dias ?? '-'}
              </Text>
              <Text style={styles.itemDescricao}>Obs: {item.observacoes || '-'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  carregarFornecedor(
                    item.id,
                    item.nome,
                    item.contato,
                    item.telefone,
                    item.email,
                    item.prazo_entrega_dias,
                    item.observacoes
                  )
                }
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => excluirFornecedor(item.id)}>
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
  textArea: { minHeight: 64, textAlignVertical: 'top' },
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
