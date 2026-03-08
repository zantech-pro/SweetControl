import React, { useState } from 'react';
import { FlatList, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

export default function Marketing() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const templates = useSelector((state: RootState) => state.business.marketingTemplates);
  const clientes = useSelector((state: RootState) => state.referenceData.clientes);
  const crmRegistros = useSelector((state: RootState) => state.business.crmRegistros);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<'promocao' | 'whatsapp' | 'oferta'>('promocao');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [crmClienteId, setCrmClienteId] = useState<number | null>(null);
  const [crmObs, setCrmObs] = useState('');

  async function compartilharWhatsApp(texto: string) {
    await Share.share({ message: texto });
  }

  function resetTemplateForm() {
    setTitulo('');
    setConteudo('');
    setTipo('promocao');
    setEditandoId(null);
  }

  function salvarTemplate() {
    if (!titulo.trim() || !conteudo.trim()) return;

    if (editandoId) {
      dispatch(updateMarketingTemplateLocal({ id: editandoId, titulo: titulo.trim(), conteudo: conteudo.trim(), tipo }));
      dispatch(
        enqueueSyncItem({
          entity: 'marketing_templates',
          endpoint: '/marketing/templates/update.php',
          method: 'PUT',
          payload: { id: editandoId, titulo: titulo.trim(), conteudo: conteudo.trim(), tipo },
        })
      );
      resetTemplateForm();
      return;
    }

    const id = -Date.now();
    dispatch(addMarketingTemplateLocal({ id, titulo: titulo.trim(), conteudo: conteudo.trim(), tipo }));
    dispatch(
      enqueueSyncItem({
        entity: 'marketing_templates',
        endpoint: '/marketing/templates/create.php',
        method: 'POST',
        payload: { titulo: titulo.trim(), conteudo: conteudo.trim(), tipo },
      })
    );
    resetTemplateForm();
  }

  function excluirTemplate(id: number) {
    dispatch(removeMarketingTemplateLocal(id));
    dispatch(
      enqueueSyncItem({
        entity: 'marketing_templates',
        endpoint: '/marketing/templates/delete.php',
        method: 'DELETE',
        payload: { id },
      })
    );
  }

  function salvarCrm() {
    if (!crmClienteId || !crmObs.trim()) return;
    const cliente = clientes.find((item) => item.id === crmClienteId);
    if (!cliente) return;

    dispatch(
      addCrmRegistroLocal({
        id: -Date.now(),
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
        payload: { cliente_id: crmClienteId, observacao: crmObs.trim() },
      })
    );
    setCrmObs('');
  }

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.title, { color: activeTheme.text }]}>Marketing & Precos</Text>

      <View style={[styles.card, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.sectionTitle}>Template editavel</Text>
        <TextInput value={titulo} onChangeText={setTitulo} placeholder="Titulo" style={styles.input} />
        <TextInput value={conteudo} onChangeText={setConteudo} placeholder="Conteudo" style={[styles.input, { height: 70 }]} multiline />
        <View style={styles.row}>
          {(['promocao', 'whatsapp', 'oferta'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, { borderColor: tipo === item ? activeTheme.primary : '#ccc' }]}
              onPress={() => setTipo(item)}
            >
              <Text style={{ color: tipo === item ? activeTheme.primary : '#555' }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeTheme.primary }]} onPress={salvarTemplate}>
          <Text style={styles.primaryText}>{editandoId ? 'Atualizar template' : 'Salvar template'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 14 }}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <Text style={[styles.itemTitle, { color: activeTheme.text }]}>{item.titulo}</Text>
            <Text style={styles.itemBody}>{item.conteudo}</Text>
            <View style={styles.row}>
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

      <View style={[styles.card, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.sectionTitle}>CRM Clientes</Text>
        <FlatList
          horizontal
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 6 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
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
          style={styles.input}
        />
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: activeTheme.primary }]} onPress={salvarCrm}>
          <Text style={styles.primaryText}>Salvar CRM</Text>
        </TouchableOpacity>
        <Text style={styles.small}>Registros CRM: {crmRegistros.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 12, padding: 12, marginBottom: 10 },
  sectionTitle: { fontWeight: '700', color: '#444', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 6 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  primaryBtn: { borderRadius: 10, padding: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  itemCard: { borderRadius: 12, padding: 12, marginBottom: 8 },
  itemTitle: { fontWeight: '700' },
  itemBody: { color: '#666', marginTop: 4, marginBottom: 8 },
  actionShare: { color: '#43a047', fontWeight: '700' },
  actionEdit: { color: '#1e88e5', fontWeight: '700' },
  actionDelete: { color: '#e53935', fontWeight: '700' },
  small: { color: '#666', marginTop: 8 },
});
