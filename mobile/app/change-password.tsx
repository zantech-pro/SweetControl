import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { apiClient } from '../src/api/client';
import { themes } from '../src/theme/themes';
import { ui } from '../src/ui/ui';
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
      Alert.alert('Senha alterada', 'FaÃ§a login novamente com a nova senha.');
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
    <View style={[ui.screen, { backgroundColor: themes.verde.background, justifyContent: 'center' }]}>
      <View style={ui.card}>
        <Text style={[ui.title, { color: themes.verde.primary }]}>Trocar senha</Text>
        <Text style={styles.subtitle}>Conta: {user?.email ?? '-'}</Text>
        <TextInput
          value={senhaAtual}
          onChangeText={setSenhaAtual}
          placeholder="Senha atual"
          placeholderTextColor="#8a8a8a"
          secureTextEntry
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
          onPress={alterarSenha}
          disabled={loading}
        >
          <Text style={ui.primaryText}>Atualizar senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: '#666', marginBottom: 10 },
});
