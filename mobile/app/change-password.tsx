import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../src/api/client';
import { RootState } from '../src/store';
import { logout } from '../src/store/slices/sessionSlice';

type ChangePasswordResponse = {
  success: boolean;
  error?: string;
};

export default function ChangePasswordScreen() {
  const dispatch = useDispatch();
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const user = useSelector((state: RootState) =>
    activeUserId ? (state.session.knownUsers ?? {})[String(activeUserId)] : null
  );
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function alterarSenha() {
    if (!user?.email) {
      Alert.alert('Erro', 'Usuario nao identificado.');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post<ChangePasswordResponse>('/auth/change_password.php', {
        email: user.email,
        senha_atual: senhaAtual.trim(),
        nova_senha: novaSenha.trim(),
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Falha ao trocar senha');
      }
      Alert.alert('Senha alterada', 'Faça login novamente com a nova senha.');
      dispatch(logout());
      router.replace('/login' as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao alterar senha';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Trocar senha</Text>
        <Text style={styles.subtitle}>Conta: {user?.email ?? '-'}</Text>
        <TextInput value={senhaAtual} onChangeText={setSenhaAtual} placeholder="Senha atual" secureTextEntry style={styles.input} />
        <TextInput value={novaSenha} onChangeText={setNovaSenha} placeholder="Nova senha" secureTextEntry style={styles.input} />
        <TouchableOpacity style={styles.button} onPress={alterarSenha} disabled={loading}>
          <Text style={styles.buttonText}>Atualizar senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#f1f8e9' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#1b5e20', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 10 },
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
});
