import React from 'react';
import { Redirect, Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { logout } from '../../src/store/slices/sessionSlice';
import { setTheme } from '../../src/store/slices/themeSlice';
import { ThemeType, themes } from '../../src/theme/themes';
import { runSyncCycle } from '../../src/store/syncService';
import { clearFailedSyncItems } from '../../src/store/slices/syncQueueSlice';

export default function TabsLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const syncQueue = useSelector((state: RootState) => state.syncQueue);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;
  const [menuOpen, setMenuOpen] = React.useState(false);

  if (!isAuthenticated) {
    return <Redirect href={'/login' as never} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {menuOpen ? (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={[styles.menuPanel, { backgroundColor: activeTheme.card }]}>
            <Text style={[styles.menuTitle, { color: activeTheme.text }]}>Configuração</Text>

            <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
              <Text style={styles.sectionTitle}>Sincronização</Text>
              <Text style={styles.smallText}>Usuário ativo: {activeUserId ?? '-'}</Text>
              <Text style={styles.smallText}>
                Pendentes: {syncQueue.pendingSync.filter((item) => item.usuario_id === activeUserId).length}
              </Text>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#1e88e5' }]}
                onPress={() => runSyncCycle(dispatch)}
              >
                <Text style={styles.btnText}>Sincronizar Agora</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#c62828' }]}
                onPress={() => dispatch(clearFailedSyncItems())}
              >
                <Text style={styles.btnText}>Limpar Pendências com Erro</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Tema</Text>
              {(Object.keys(themes) as ThemeType[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.menuBtn, { backgroundColor: themes[key].primary }]}
                  onPress={() => dispatch(setTheme(key))}
                >
                  <Text style={styles.btnText}>{themes[key].name}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionTitle}>Ajuste de Perfil</Text>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#6d4c41' }]}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/change-password' as never);
                }}
              >
                <Text style={styles.btnText}>Trocar Senha</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#8d6e63' }]}
                onPress={() => {
                  dispatch(logout());
                  setMenuOpen(false);
                  router.replace('/login' as never);
                }}
              >
                <Text style={styles.btnText}>Sair</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Pendências de Sync</Text>
              {syncQueue.pendingSync.filter((item) => item.usuario_id === activeUserId).length === 0 ? (
                <Text style={styles.smallText}>Sem pendências para este usuário.</Text>
              ) : (
                syncQueue.pendingSync
                  .filter((item) => item.usuario_id === activeUserId)
                  .map((item) => (
                    <View key={item.id} style={styles.pendingCard}>
                      <Text style={styles.pendingTitle}>
                        {item.entity} - {item.method}
                      </Text>
                      <Text style={styles.smallText}>Endpoint: {item.endpoint}</Text>
                      <Text style={styles.smallText}>Tentativas: {item.attempts}</Text>
                      <Text style={styles.smallText}>
                        Erro: {item.lastError ?? 'Sem erro registrado'}
                      </Text>
                    </View>
                  ))
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}

      <Tabs
        initialRouteName="caixa"
        screenOptions={{
          headerStyle: { backgroundColor: activeTheme.card },
          headerTitleStyle: { color: activeTheme.text },
          headerTitleAlign: 'center',
          tabBarStyle: { backgroundColor: activeTheme.card },
          tabBarActiveTintColor: activeTheme.primary,
          tabBarInactiveTintColor: '#7a7a7a',
          headerLeft: () => (
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ marginLeft: 12 }}>
              <Ionicons name="menu" size={24} color={activeTheme.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                dispatch(logout());
                router.replace('/login' as never);
              }}
              style={{ marginRight: 12 }}
            >
              <Ionicons name="log-out-outline" size={22} color={activeTheme.text} />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="caixa"
          options={{
            title: 'Caixa',
            tabBarIcon: ({ color, size }) => <Ionicons name="cash" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="estoque-gestao"
          options={{
            title: 'Estoque',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="categorias"
          options={{
            title: 'Categorias',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="produtos"
          options={{
            title: 'Produtos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pricetag-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="clientes"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="marketing"
          options={{
            title: 'Marketing',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="megaphone-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="bi"
          options={{
            title: 'BI',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen name="vendas" options={{ href: null }} />
        <Tabs.Screen name="estoque" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    flexDirection: 'row',
  },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menuPanel: { width: 300, padding: 14, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  menuTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  menuScroll: { flex: 1 },
  menuContent: { paddingTop: 18, paddingBottom: 24 },
  menuBtn: { marginTop: 8, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { marginTop: 14, marginBottom: 6, fontWeight: '700', color: '#444' },
  smallText: { color: '#666' },
  pendingCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  pendingTitle: { color: '#333', fontWeight: '700', marginBottom: 4 },
});
