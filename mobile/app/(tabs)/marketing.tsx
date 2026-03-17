import React, { useState } from 'react';
import { Alert, FlatList, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import {
  addCrmRegistroLocal,
  addMarketingTemplateLocal,
  removeMarketingTemplateLocal,
  updateMarketingTemplateLocal,
} from '../../src/store/slices/businessSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import { ui } from '../../src/ui/ui';

export default function Marketing() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const templates = useSelector((state: RootState) =>
    state.business.marketingTemplates.filter((item) => item.usuario_id === activeUserId)
  );
  const clientes = useSelector((state: RootState) =>
    state.referenceData.clientes.filter((item) => item.usuario_id === activeUserId)
  );
  const crmRegistros = useSelector((state: RootState) =>
    state.business.crmRegistros.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<'promocao' | 'whatsapp' | 'oferta'>('promocao');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [templateBusca, setTemplateBusca] = useState('');
  const [templateFormVisivel, setTemplateFormVisivel] = useState(false);

  const [crmClienteId, setCrmClienteId] = useState<number | null>(null);
  const [crmObs, setCrmObs] = useState('');
  const [crmBusca, setCrmBusca] = useState('');
  const [crmFormVisivel, setCrmFormVisivel] = useState(false);

  const templatesFiltrados = React.useMemo(() => {
    const term = templateBusca.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((item) => item.titulo.toLowerCase().includes(term));
  }, [templates, templateBusca]);

  const clientesFiltrados = React.useMemo(() => {
    const term = crmBusca.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((item) => item.nome.toLowerCase().includes(term));
  }, [clientes, crmBusca]);

  async function compartilharWhatsApp(texto: string) {
    await Share.share({ message: texto });
  }

  function resetTemplateForm() {
    setTitulo('');
    setConteudo('');
    setTipo('promocao');
    setEditandoId(null);
    setTemplateFormVisivel(false);
  }

  function salvarTemplate() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    if (!titulo.trim() || !conteudo.trim()) return;

    if (editandoId) {
      dispatch(
        updateMarketingTemplateLocal({
          id: editandoId,
          usuario_id: activeUserId,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          tipo,
        })
      );
      dispatch(
        enqueueSyncItem({
          entity: 'marketing_templates',
          endpoint: '/marketing/templates/update.php',
          method: 'PUT',
          usuario_id: activeUserId,
          payload: { id: editandoId, titulo: titulo.trim(), conteudo: conteudo.trim(), tipo },
        })
      );
      resetTemplateForm();
      return;
    }

    const id = -Date.now();
    dispatch(
      addMarketingTemplateLocal({
        id,
        usuario_id: activeUserId,
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        tipo,
      })
    );
    dispatch(
      enqueueSyncItem({
        entity: 'marketing_templates',
        endpoint: '/marketing/templates/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          usuario_id: activeUserId,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          tipo,
        },
      })
    );
    resetTemplateForm();
  }

  function excluirTemplate(id: number) {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }

    dispatch(removeMarketingTemplateLocal({ id, usuario_id: activeUserId }));
    dispatch(
      enqueueSyncItem({
        entity: 'marketing_templates',
        endpoint: '/marketing/templates/delete.php',
        method: 'DELETE',
        usuario_id: activeUserId,
        payload: { id, usuario_id: activeUserId },
      })
    );
  }

  function salvarCrm() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    if (!crmClienteId || !crmObs.trim()) return;
    const cliente = clientes.find((item) => item.id === crmClienteId);
    if (!cliente) return;

    dispatch(
      addCrmRegistroLocal({
        id: -Date.now(),
        usuario_id: activeUserId,
        cliente_id: crmClienteId,
        cliente_nome: cliente.nome,
        observacao: crmObs.trim(),
        criado_em: new Date().toISOString(),
      })
    );
    dispatch(
      enqueueSyncItem({
        entity: 'crm_registros',
        endpoint: '/crm/registros/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          usuario_id: activeUserId,
          cliente_id: crmClienteId,
          observacao: crmObs.trim(),
        },
      })
    );
    setCrmObs('');
    setCrmFormVisivel(false);
  }

  return (
    <View style={[ui.screen, { backgroundColor: activeTheme.background }]}>
      <Text style={[ui.title, { color: activeTheme.text }]}>Marketing & Precos</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={() => {
            setTemplateFormVisivel((prev) => !prev);
            if (!templateFormVisivel) setEditandoId(null);
          }}
        >
          <Text style={ui.primaryText}>
            {templateFormVisivel ? 'Fechar template' : 'Novo template'}
          </Text>
        </TouchableOpacity>
      </View>

      {templateFormVisivel ? (
        <View style={[ui.card, styles.card]}>
          <Text style={ui.sectionTitle}>Template editavel</Text>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Titulo"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <TextInput
            value={conteudo}
            onChangeText={setConteudo}
            placeholder="Conteudo"
            placeholderTextColor="#8a8a8a"
            style={[ui.input, { height: 70 }]}
            multiline
          />
          <View style={ui.row}>
            {(['promocao', 'whatsapp', 'oferta'] as const).map((item) => (
              <TouchableOpacity
                key={item}
                style={[ui.chip, { borderColor: tipo === item ? activeTheme.primary : '#ccc' }]}
                onPress={() => setTipo(item)}
              >
                <Text style={{ color: tipo === item ? activeTheme.primary : '#555' }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]} onPress={salvarTemplate}>
            <Text style={ui.primaryText}>{editandoId ? 'Atualizar template' : 'Salvar template'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TextInput
        value={templateBusca}
        onChangeText={setTemplateBusca}
        placeholder="Pesquisar template"
        placeholderTextColor="#8a8a8a"
        style={ui.searchInput}
      />

      <FlatList
        data={templatesFiltrados}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 14 }}
        renderItem={({ item }) => (
          <View style={[ui.listCard, styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <Text style={[styles.itemTitle, { color: activeTheme.text }]}>{item.titulo}</Text>
            <Text style={styles.itemBody}>{item.conteudo}</Text>
            <View style={ui.row}>
              <TouchableOpacity onPress={() => compartilharWhatsApp(item.conteudo)}>
                <Text style={styles.actionShare}>Compartilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditandoId(item.id);
                  setTitulo(item.titulo);
                  setConteudo(item.conteudo);
                  setTipo(item.tipo);
                }}
              >
                <Text style={styles.actionEdit}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => excluirTemplate(item.id)}>
                <Text style={styles.actionDelete}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={() => setCrmFormVisivel((prev) => !prev)}
        >
          <Text style={ui.primaryText}>
            {crmFormVisivel ? 'Fechar CRM' : 'Novo registro CRM'}
          </Text>
        </TouchableOpacity>
      </View>

      {crmFormVisivel ? (
        <View style={[ui.card, styles.card]}>
          <Text style={ui.sectionTitle}>CRM Clientes</Text>
          <TextInput
            value={crmBusca}
            onChangeText={setCrmBusca}
            placeholder="Pesquisar cliente"
            placeholderTextColor="#8a8a8a"
            style={ui.searchInput}
          />
          <FlatList
            data={clientesFiltrados}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.gridList}
            columnWrapperStyle={styles.gridRow}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  ui.chip,
                  styles.gridItem,
                  { borderColor: crmClienteId === item.id ? activeTheme.primary : '#ccc' },
                ]}
                onPress={() => setCrmClienteId(item.id)}
              >
                <Text style={{ color: crmClienteId === item.id ? activeTheme.primary : '#555' }}>{item.nome}</Text>
              </TouchableOpacity>
            )}
          />
          <TextInput
            value={crmObs}
            onChangeText={setCrmObs}
            placeholder="Observacao de relacionamento"
            placeholderTextColor="#8a8a8a"
            style={ui.input}
          />
          <TouchableOpacity style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]} onPress={salvarCrm}>
            <Text style={ui.primaryText}>Salvar CRM</Text>
          </TouchableOpacity>
          <Text style={styles.small}>Registros CRM: {crmRegistros.length}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  card: { marginBottom: 10 },
  itemCard: {},
  itemTitle: { fontWeight: '700' },
  itemBody: { color: '#666', marginTop: 4, marginBottom: 8 },
  actionShare: { color: '#43a047', fontWeight: '700' },
  actionEdit: { color: '#1e88e5', fontWeight: '700' },
  actionDelete: { color: '#e53935', fontWeight: '700' },
  small: { color: '#666', marginTop: 8 },
  gridList: { paddingBottom: 6 },
  gridRow: { gap: 8, paddingBottom: 8 },
  gridItem: { flex: 1, marginRight: 0 },
});
