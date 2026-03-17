import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../src/api/client';
import { themes } from '../src/theme/themes';
import { ui } from '../src/ui/ui';

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
    <View style={[ui.screen, { backgroundColor: themes.verde.background, justifyContent: 'center' }]}>
      <View style={ui.card}>
        <Text style={[ui.title, { color: themes.verde.primary }]}>Recuperar senha</Text>
        <Text style={ui.subtitle}>Enviamos um codigo para seu email.</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8a8a8a"
          autoCapitalize="none"
          style={ui.input}
        />
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: themes.verde.primary, marginBottom: 10 }]}
          onPress={solicitarCodigo}
          disabled={loading}
        >
          <Text style={ui.primaryText}>Solicitar codigo</Text>
        </TouchableOpacity>
        <TextInput
          value={codigo}
          onChangeText={setCodigo}
          placeholder="Codigo recebido"
          placeholderTextColor="#8a8a8a"
          style={ui.input}
        />
        <TextInput
          value={novaSenha}
          onChangeText={setNovaSenha}
          placeholder="Nova senha"
          placeholderTextColor="#8a8a8a"
          secureTextEntry
          style={ui.input}
        />
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: themes.verde.primary }]}
          onPress={redefinirSenha}
          disabled={loading}
        >
          <Text style={ui.primaryText}>Redefinir senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});

