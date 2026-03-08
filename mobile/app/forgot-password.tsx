import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../src/api/client';

type RequestResetResponse = {
  success: boolean;
  message?: string;
  codigo_debug?: string;
  error?: string;
};

type ResetPasswordResponse = {
  success: boolean;
  error?: string;
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function solicitarCodigo() {
    setLoading(true);
    try {
      const response = await apiClient.post<RequestResetResponse>('/auth/request_reset.php', {
        email: email.trim().toLowerCase(),
      });
      const msg = response.data.codigo_debug
        ? `${response.data.message}\nCodigo: ${response.data.codigo_debug}`
        : response.data.message || 'Solicitacao enviada.';
      Alert.alert('Recuperacao', msg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar codigo';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  async function redefinirSenha() {
    setLoading(true);
    try {
      const response = await apiClient.post<ResetPasswordResponse>('/auth/reset_password.php', {
        email: email.trim().toLowerCase(),
        codigo: codigo.trim(),
        nova_senha: novaSenha.trim(),
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Falha ao redefinir senha');
      }
      Alert.alert('Sucesso', 'Senha redefinida. Faca login novamente.');
      router.replace('/login' as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Recuperar senha</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={styles.input} />
        <TouchableOpacity style={styles.button} onPress={solicitarCodigo} disabled={loading}>
          <Text style={styles.buttonText}>Solicitar codigo</Text>
        </TouchableOpacity>
        <TextInput value={codigo} onChangeText={setCodigo} placeholder="Codigo recebido" style={styles.input} />
        <TextInput value={novaSenha} onChangeText={setNovaSenha} placeholder="Nova senha" secureTextEntry style={styles.input} />
        <TouchableOpacity style={styles.button} onPress={redefinirSenha} disabled={loading}>
          <Text style={styles.buttonText}>Redefinir senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#f1f8e9' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#1b5e20', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  button: { backgroundColor: '#2e7d32', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

