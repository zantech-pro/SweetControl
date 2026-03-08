import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { themes, ThemeType } from '../../src/theme/themes';
import { setTheme } from '../../src/store/slices/themeSlice';
import { AppDispatch, RootState } from '../../src/store';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import { runSyncCycle } from '../../src/store/syncService';

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const syncQueue = useSelector((state: RootState) => state.syncQueue);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  function handleQueueExample() {
    dispatch(
      enqueueSyncItem({
        entity: 'vendas',
        endpoint: '/vendas/create.php',
        method: 'POST',
        payload: {
          usuario_id: 1,
          total_bruto: 35.5,
          desconto: 0,
          total_liquido: 35.5,
          metodo_pagamento: 'pix',
          status_sincronizacao: 'offline',
        },
      })
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: activeTheme.background }}>
      <View style={styles.container}>
        <Text style={[styles.welcome, { color: activeTheme.text }]}>
          Bem-vinda, Simone!
        </Text>
        
        <View style={[styles.card, { backgroundColor: activeTheme.card }]}>
          <Text style={styles.cardTitle}>Escolha a cor do seu dia:</Text>
          
          <View style={styles.grid}>
            {(Object.keys(themes) as ThemeType[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.btn, 
                  { backgroundColor: themes[key].primary },
                  themeName === key && styles.btnActive
                ]}
                onPress={() => dispatch(setTheme(key))}
              >
                <Text style={styles.btnText}>{themes[key].name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: activeTheme.card }]}>
          <Text style={styles.cardTitle}>Offline First (Etapa 1)</Text>
          <Text style={styles.syncInfo}>Pendentes: {syncQueue.pendingSync.length}</Text>
          <Text style={styles.syncInfo}>
            Ultimo sync: {syncQueue.lastSyncAt ? new Date(syncQueue.lastSyncAt).toLocaleString() : '-'}
          </Text>
          <Text style={styles.syncInfo}>
            Status: {syncQueue.isSyncing ? 'Sincronizando...' : 'Aguardando'}
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: activeTheme.primary }]}
            onPress={handleQueueExample}
          >
            <Text style={styles.btnText}>Enfileirar Venda Offline (Teste)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1e88e5' }]}
            onPress={() => runSyncCycle(dispatch)}
          >
            <Text style={styles.btnText}>Sincronizar Agora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  card: { width: '100%', padding: 20, borderRadius: 15, elevation: 3 },
  cardTitle: { fontSize: 16, marginBottom: 15, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  btn: { width: '48%', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  btnActive: { borderWidth: 3, borderColor: '#000' },
  btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  syncInfo: { fontSize: 14, color: '#444', marginBottom: 6 },
  actionBtn: { marginTop: 10, padding: 12, borderRadius: 10, alignItems: 'center' },
});
