import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../src/store';
import { themes, ThemeType } from '../../src/theme/themes';

// Mock de dados (Simulação de vendas para o protótipo)
const VENDAS_RECENTES = [
  { id: '1', cliente: 'Maria Silva', produto: 'Bolo de Pote (Verde)', valor: 'R$ 15,00', status: 'Concluído' },
  { id: '2', cliente: 'João Paulo', produto: 'Bolo de Cenoura', valor: 'R$ 45,00', status: 'Pendente' },
  { id: '3', cliente: 'Ana Costa', produto: 'Cento de Brigadeiro', valor: 'R$ 80,00', status: 'Concluído' },
];

export default function Vendas() {
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const renderItem = ({ item }: { item: typeof VENDAS_RECENTES[0] }) => (
    <View style={[styles.saleCard, { backgroundColor: activeTheme.card }]}>
      <View>
        <Text style={[styles.clientName, { color: activeTheme.text }]}>{item.cliente}</Text>
        <Text style={styles.productName}>{item.produto}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.value, { color: activeTheme.primary }]}>{item.valor}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <Text style={[styles.header, { color: activeTheme.text }]}>Resumo de Vendas</Text>
      
      <FlatList
        data={VENDAS_RECENTES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Botão Flutuante para Nova Venda */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: activeTheme.primary }]}
        onPress={() => alert('Abrir formulário de nova venda (Fase 2)')}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  saleCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  clientName: { fontSize: 16, fontWeight: 'bold' },
  productName: { fontSize: 14, color: '#666' },
  value: { fontSize: 16, fontWeight: 'bold' }, 
  status: { fontSize: 12, color: '#999' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10, 
  }
});
