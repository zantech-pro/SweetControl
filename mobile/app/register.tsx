import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { AxiosError } from 'axios';
import { apiClient } from '../src/api/client';
import { AppDispatch } from '../src/store';
import { makeOfflinePasswordHash } from '../src/store/passwordHash';
import { loginSuccessOnline } from '../src/store/slices/sessionSlice';
import { themes } from '../src/theme/themes';
import { ui } from '../src/ui/ui';

type RegisterResponse = {
  success: boolean;
  token?: string;
  user?: { id: number; nome: string; email: string };
  error?: string;
  details?: string;
};

export default function RegisterScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const nomeValue = nome.trim();
    const emailValue = email.trim().toLowerCase();
    const senhaValue = senha.trim();
    if (!nomeValue || !emailValue || !senhaValue) {
      Alert.alert('Validacao', 'Preencha nome, email e senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register.php', {
        nome: nomeValue,
        email: emailValue,
        telefone: telefone.trim() || null,
        senha: senhaValue,
      });

      if (!response.data.success || !response.data.user) {
        throw new Error(response.data.error || 'Falha ao registrar usuario.');
      }

      dispatch(
        loginSuccessOnline({
          user: response.data.user,
          token: response.data.token ?? null,
          passwordHash: makeOfflinePasswordHash(senhaValue),
        })
      );

      Alert.alert('Conta criada', 'Cadastro realizado com sucesso.');
      router.replace('/(tabs)' as never);
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Erro ao cadastrar';
      if (error instanceof AxiosError) {
        const data = error.response?.data as RegisterResponse | undefined;
        if (data?.error) {
          message = data.details ? `${data.error}\n${data.details}` : data.error;
        }
      }
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[ui.screen, { backgroundColor: themes.verde.background }]}>
      <View style={ui.card}>
        <Text style={[ui.title, { color: themes.verde.primary }]}>Criar conta</Text>
        <Text style={ui.subtitle}>Vamos preparar seu acesso em segundos.</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome"
          placeholderTextColor="#8a8a8a"
          style={ui.input}
        />
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
          value={telefone}
          onChangeText={setTelefone}
          placeholder="Telefone (opcional)"
          placeholderTextColor="#8a8a8a"
          keyboardType="phone-pad"
          style={ui.input}
        />
        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder="Senha (min 6)"
          placeholderTextColor="#8a8a8a"
          secureTextEntry
          style={ui.input}
        />
        <TouchableOpacity
          style={[ui.primaryBtn, { backgroundColor: themes.verde.primary }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={ui.primaryText}>{loading ? 'Criando...' : 'Criar conta'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/login' as never)}>
          <Text style={styles.link}>Ja tenho conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  link: { color: '#1e88e5', fontWeight: '600', marginTop: 12, textAlign: 'center' },
});
