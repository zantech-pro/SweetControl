import React from 'react';
import { Redirect, Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { logout, updateUserProfile } from '../../src/store/slices/sessionSlice';
import { setTheme } from '../../src/store/slices/themeSlice';
import { ThemeType, themes } from '../../src/theme/themes';
import { runSyncCycle } from '../../src/store/syncService';
import { clearFailedSyncItems, enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import * as ImagePicker from 'expo-image-picker';

function getInitials(value: string | undefined | null) {
  if (!value) return 'SC';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'SC';
}

export default function TabsLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const activeUser = useSelector((state: RootState) =>
    state.session.activeUserId ? state.session.knownUsers[String(state.session.activeUserId)] : null
  );
  const syncQueue = useSelector((state: RootState) => state.syncQueue);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileName, setProfileName] = React.useState('');
  const [avatarBusy, setAvatarBusy] = React.useState(false);

  React.useEffect(() => {
    setProfileName(activeUser?.nome ?? '');
  }, [activeUser?.nome]);

  if (!isAuthenticated) {
    return <Redirect href={'/login' as never} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {profileOpen ? (
        <View style={styles.profileOverlay}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            onPress={() => setProfileOpen(false)}
          />
          <View style={[styles.profilePanel, { backgroundColor: activeTheme.card }]}>
            <Text style={[styles.menuTitle, { color: activeTheme.text }]}>Meu Perfil</Text>

            <View style={styles.avatarWrap}>
              {activeUser?.avatarUri ? (
                <Image source={{ uri: activeUser.avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(activeUser?.nome)}</Text>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#2e7d32', flex: 1 }]}
                onPress={async () => {
                  if (avatarBusy || !activeUserId) return;
                  setAvatarBusy(true);
                  try {
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!perm.granted) {
                      Alert.alert('Permissao', 'Permita acesso a galeria para alterar a foto.');
                      return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      quality: 0.8,
                      base64: true,
                    });
                    if (!result.canceled) {
                      const asset = result.assets?.[0];
                      const dataUrl =
                        asset?.base64 && asset?.mimeType
                          ? `data:${asset.mimeType};base64,${asset.base64}`
                          : asset?.base64
                          ? `data:image/jpeg;base64,${asset.base64}`
                          : asset?.uri;
                      if (dataUrl) {
                        dispatch(updateUserProfile({ userId: activeUserId, avatarUri: dataUrl }));
                        dispatch(
                          enqueueSyncItem({
                            entity: 'usuarios',
                            endpoint: '/usuarios/update-profile.php',
                            method: 'PUT',
                            usuario_id: activeUserId,
                            payload: { avatar_url: dataUrl },
                          })
                        );
                        void runSyncCycle(dispatch, () => store.getState());
                      }
                    }
                  } finally {
                    setAvatarBusy(false);
                  }
                }}
              >
                <Text style={styles.btnText}>
                  {avatarBusy ? 'Carregando...' : 'Galeria'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#1e88e5', flex: 1 }]}
                onPress={async () => {
                  if (avatarBusy || !activeUserId) return;
                  setAvatarBusy(true);
                  try {
                    const perm = await ImagePicker.requestCameraPermissionsAsync();
                    if (!perm.granted) {
                      Alert.alert('Permissao', 'Permita acesso a camera para tirar a foto.');
                      return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                      allowsEditing: true,
                      quality: 0.8,
                      base64: true,
                    });
                    if (!result.canceled) {
                      const asset = result.assets?.[0];
                      const dataUrl =
                        asset?.base64 && asset?.mimeType
                          ? `data:${asset.mimeType};base64,${asset.base64}`
                          : asset?.base64
                          ? `data:image/jpeg;base64,${asset.base64}`
                          : asset?.uri;
                      if (dataUrl) {
                        dispatch(updateUserProfile({ userId: activeUserId, avatarUri: dataUrl }));
                        dispatch(
                          enqueueSyncItem({
                            entity: 'usuarios',
                            endpoint: '/usuarios/update-profile.php',
                            method: 'PUT',
                            usuario_id: activeUserId,
                            payload: { avatar_url: dataUrl },
                          })
                        );
                        void runSyncCycle(dispatch, () => store.getState());
                      }
                    }
                  } finally {
                    setAvatarBusy(false);
                  }
                }}
              >
                <Text style={styles.btnText}>Camera</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Nome</Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Seu nome"
              placeholderTextColor="#888"
              style={[styles.input, { color: activeTheme.text }]}
            />
            <TouchableOpacity
              style={[styles.menuBtn, { backgroundColor: '#1e88e5' }]}
              onPress={() => {
                if (!activeUserId) return;
                const trimmed = profileName.trim();
                if (!trimmed) {
                  Alert.alert('Nome', 'Informe um nome valido.');
                  return;
                }
                dispatch(updateUserProfile({ userId: activeUserId, nome: trimmed }));
                dispatch(
                  enqueueSyncItem({
                    entity: 'usuarios',
                    endpoint: '/usuarios/update-profile.php',
                    method: 'PUT',
                    usuario_id: activeUserId,
                    payload: { nome: trimmed },
                  })
                );
                void runSyncCycle(dispatch, () => store.getState());
                Alert.alert('Perfil', 'Nome atualizado.');
              }}
            >
              <Text style={styles.btnText}>Salvar Nome</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Acesso</Text>
            <TouchableOpacity
              style={[styles.menuBtn, { backgroundColor: '#6d4c41' }]}
              onPress={() => {
                setProfileOpen(false);
                router.push('/change-password' as never);
              }}
            >
              <Text style={styles.btnText}>Trocar Senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuBtn, { backgroundColor: '#c62828' }]}
              onPress={() => {
                dispatch(logout());
                setProfileOpen(false);
                router.replace('/login' as never);
              }}
            >
              <Text style={styles.btnText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {menuOpen ? (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={[styles.menuPanel, { backgroundColor: activeTheme.card }]}>
            <Text style={[styles.menuTitle, { color: activeTheme.text }]}>Configuracao</Text>

            <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
              <Text style={styles.sectionTitle}>Sincronizacao</Text>
              <Text style={styles.smallText}>Usuario ativo: {activeUserId ?? '-'}</Text>
              <Text style={styles.smallText}>
                Pendentes: {syncQueue.pendingSync.filter((item) => item.usuario_id === activeUserId).length}
              </Text>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#1e88e5' }]}
                onPress={async () => {
                  const result = await runSyncCycle(dispatch, () => store.getState());
                  const payload = (result as { payload?: { successCount?: number; failedCount?: number } } | null)?.payload;
                  if (payload && typeof payload.successCount === 'number') {
                    Alert.alert(
                      'Sincronizacao',
                      `Enviados: ${payload.successCount} | Falhas: ${payload.failedCount ?? 0}`
                    );
                    return;
                  }

                  Alert.alert('Sincronizacao', 'Nenhum item processado nesta tentativa.');
                }}
              >
                <Text style={styles.btnText}>Sincronizar Agora</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuBtn, { backgroundColor: '#c62828' }]}
                onPress={() => dispatch(clearFailedSyncItems())}
              >
                <Text style={styles.btnText}>Limpar Pendencias com Erro</Text>
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

              <Text style={styles.sectionTitle}>Pendencias de Sync</Text>
              {syncQueue.pendingSync.filter((item) => item.usuario_id === activeUserId).length === 0 ? (
                <Text style={styles.smallText}>Sem pendencias para este usuario.</Text>
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
                setMenuOpen(false);
                setProfileOpen(true);
              }}
              style={{ marginRight: 12 }}
            >
              <View style={styles.headerUserWrap}>
                {activeUser?.avatarUri ? (
                  <Image source={{ uri: activeUser.avatarUri }} style={styles.avatarMini} />
                ) : (
                  <View style={styles.avatarMiniFallback}>
                    <Text style={styles.avatarMiniText}>{getInitials(activeUser?.nome)}</Text>
                  </View>
                )}
                <Text style={[styles.headerUserText, { color: activeTheme.text }]}>
                  {activeUser?.nome ? activeUser.nome.split(' ')[0] : 'Usuario'}
                </Text>
              </View>
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
          name="fornecedores"
          options={{
            title: 'Fornecedores',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="compras"
          options={{
            title: 'Compras',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="gastos"
          options={{
            title: 'Gastos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" color={color} size={size} />
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
  profileOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 110,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menuPanel: { width: 300, padding: 14, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  profilePanel: { width: 280, padding: 14, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  menuTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  menuScroll: { flex: 1 },
  menuContent: { paddingTop: 18, paddingBottom: 24 },
  menuBtn: { marginTop: 8, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { marginTop: 14, marginBottom: 6, fontWeight: '700', color: '#444' },
  smallText: { color: '#666' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  avatarWrap: { alignItems: 'center', marginTop: 8, marginBottom: 10 },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '700', color: '#555' },
  avatarMini: { width: 28, height: 28, borderRadius: 14 },
  avatarMiniFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: { fontSize: 12, fontWeight: '700', color: '#555' },
  headerUserWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerUserText: { fontSize: 12, fontWeight: '600' },
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
