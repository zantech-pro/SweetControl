import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState, store } from '../src/store';
import { loginWithOfflineFallback } from '../src/store/authService';
import { themes } from '../src/theme/themes';
import { ui } from '../src/ui/ui';

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const knownUsersMap = useSelector((state: RootState) =>
    state.session.knownUsers ?? {}
  );
  const knownUsers = useMemo(() => Object.values(knownUsersMap), [knownUsersMap]);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const emailValue = email.trim().toLowerCase();
    const senhaValue = senha.trim();
    if (!emailValue || !senhaValue) {
      Alert.alert('Validacao', 'Informe email e senha.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithOfflineFallback(dispatch, () => store.getState(), {
        email: emailValue,
        senha: senhaValue,
      });
      Alert.alert('Login realizado', result.mode === 'online' ? 'Conectado online.' : 'Conectado offline.');
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha no login.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[ui.screen, { backgroundColor: themes.verde.background }]}>
      <View style={[ui.card, styles.cardSpacing]}>
        <Text style={[ui.title, { color: themes.verde.primary }]}>SweetControl</Text>
        <Text style={ui.subtitle}>Sistema de Gestao para Confeitaria</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8a8a8a"
          autoCapitalize="none"
          keyboardType="email-address"
          style={ui.input}
        />
        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder="Senha"
          placeholderTextColor="#8a8a8a"
          secureTextEntry
          style={ui.input}
        />
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: themes.verde.primary }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={ui.primaryText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/register' as never)}>
          <Text style={styles.link}>Criar conta</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/forgot-password' as never)}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Offline funciona se este usuario ja logou online ao menos uma vez.</Text>
      </View>

      <View style={ui.card}>
        <Text style={styles.subtitle}>Usuarios neste dispositivo</Text>
        {knownUsers.length === 0 ? (
          <Text style={styles.hint}>Nenhum usuario salvo ainda.</Text>
        ) : (
          knownUsers.map((user) => (
            <Text key={user.id} style={styles.userItem}>
              - {user.nome} ({user.email})
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSpacing: { marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 6 },
  hint: { color: '#666', marginTop: 8 },
  link: { color: '#1e88e5', fontWeight: '600', marginTop: 12, textAlign: 'center' },
  userItem: { color: '#333', marginTop: 4 },
});
