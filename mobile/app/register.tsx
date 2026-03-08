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
    <View style={[styles.container, { backgroundColor: themes.verde.background }]}>
      <View style={styles.card}>
        <Text style={styles.title}>Criar conta</Text>
        <TextInput value={nome} onChangeText={setNome} placeholder="Nome" style={styles.input} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={telefone}
          onChangeText={setTelefone}
          placeholder="Telefone (opcional)"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder="Senha (min 6)"
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Criando...' : 'Criar conta'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/login' as never)}>
          <Text style={styles.link}>Ja tenho conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
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
  button: { backgroundColor: '#2e7d32', borderRadius: 10, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { color: '#1e88e5', fontWeight: '600', marginTop: 12, textAlign: 'center' },
});
