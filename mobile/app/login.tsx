import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { AppDispatch, RootState, store } from '../src/store';
import { loginWithOfflineFallback } from '../src/store/authService';
import { themes } from '../src/theme/themes';

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
    <View style={[styles.container, { backgroundColor: themes.verde.background }]}>
      <View style={styles.card}>
        <Text style={styles.title}>SweetControl Login</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder="Senha"
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/register' as never)}>
          <Text style={styles.link}>Criar conta</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/forgot-password' as never)}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Offline funciona se este usuario ja logou online ao menos uma vez.</Text>
      </View>

      <View style={styles.card}>
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
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#1b5e20', marginBottom: 10 },
  subtitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  button: { backgroundColor: '#2e7d32', borderRadius: 10, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  hint: { color: '#666', marginTop: 8 },
  link: { color: '#1e88e5', fontWeight: '600', marginTop: 12, textAlign: 'center' },
  userItem: { color: '#333', marginTop: 4 },
});
