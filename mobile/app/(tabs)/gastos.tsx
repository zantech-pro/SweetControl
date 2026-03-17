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
import { addGastoExtraLocal, MetodoPagamento } from '../../src/store/slices/businessSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import { formatCurrencyBRL } from '../../src/utils/formatters';
import { ui } from '../../src/ui/ui';

export default function Gastos() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const gastos = useSelector((state: RootState) =>
    state.business.gastosExtras.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const [categoria, setCategoria] = useState('Operacional');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix');
  const [formVisivel, setFormVisivel] = useState(false);
  const [busca, setBusca] = useState('');

  const gastosFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return gastos;
    return gastos.filter((item) =>
      `${item.categoria} ${item.descricao}`.toLowerCase().includes(term)
    );
  }, [gastos, busca]);

  function resetForm() {
    setCategoria('Operacional');
    setDescricao('');
    setValor('');
    setMetodo('pix');
    setFormVisivel(false);
  }

  function adicionarGasto() {
    if (!activeUserId) {
      Alert.alert('Sessao', 'Sessao invalida. Faca login novamente.');
      return;
    }
    const v = Number(valor.replace(',', '.'));
    if (Number.isNaN(v) || v <= 0) return;

    dispatch(
      addGastoExtraLocal({
        id: -Date.now(),
        usuario_id: activeUserId,
        categoria: categoria.trim() || 'Outros',
        descricao: descricao.trim() || 'Sem descricao',
        valor: v,
        metodo_pagamento: metodo,
        data_gasto: new Date().toISOString(),
      })
    );
    dispatch(
      enqueueSyncItem({
        entity: 'gastos_extras',
        endpoint: '/gastos/create.php',
        method: 'POST',
        usuario_id: activeUserId,
        payload: {
          usuario_id: activeUserId,
          categoria: categoria.trim() || 'Outros',
          descricao: descricao.trim() || 'Sem descricao',
          valor: v,
          metodo_pagamento: metodo,
          data_gasto: new Date().toISOString().slice(0, 10),
        },
      })
    );
    resetForm();
  }

  return (
    <View style={[ui.screen, { backgroundColor: activeTheme.background }]}>
      <Text style={[ui.title, { color: activeTheme.text }]}>Gastos Extras</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]}
          onPress={() => setFormVisivel((prev) => !prev)}
        >
          <Text style={ui.primaryText}>{formVisivel ? 'Fechar formulario' : 'Novo gasto'}</Text>
        </TouchableOpacity>
      </View>

      {formVisivel ? (
        <View style={[ui.card, styles.formCard]}>
          <Text style={ui.sectionTitle}>Lancar gasto extra</Text>
          <TextInput
            value={categoria}
            onChangeText={setCategoria}
            placeholder="Categoria"
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
          <TextInput
            value={valor}
            onChangeText={setValor}
            placeholder="Valor"
            placeholderTextColor="#8a8a8a"
            keyboardType="decimal-pad"
            style={ui.input}
          />
          <View style={ui.row}>
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
          <TouchableOpacity style={[ui.primaryBtn, { backgroundColor: activeTheme.primary }]} onPress={adicionarGasto}>
            <Text style={ui.primaryText}>Salvar gasto</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder="Pesquisar gasto"
        placeholderTextColor="#8a8a8a"
        style={ui.searchInput}
      />

      <FlatList
        data={gastosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={ui.empty}>Nenhum gasto cadastrado.</Text>}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[ui.listCard, styles.itemCard, { backgroundColor: activeTheme.card }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: activeTheme.text }]}>{item.categoria}</Text>
              <Text style={styles.itemDescricao}>{item.descricao}</Text>
              <Text style={styles.itemDescricao}>{item.metodo_pagamento}</Text>
            </View>
            <Text style={styles.itemValor}>{formatCurrencyBRL(item.valor)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  formCard: { marginBottom: 14 },
  listContent: { paddingBottom: 24 },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  itemDescricao: { marginTop: 4, color: '#666' },
  itemValor: { fontWeight: '700', color: '#1e88e5' },
});
