import { apiClient } from '../api/client';
import { AppDispatch, RootState } from './index';
import { makeOfflinePasswordHash } from './passwordHash';
import { loginSuccessOffline, loginSuccessOnline } from './slices/sessionSlice';

type LoginPayload = {
  email: string;
  senha: string;
};

type LoginResponse = {
  success: boolean;
  token?: string;
  user?: { id: number; nome: string; email: string; avatar_url?: string | null };
  error?: string;
};

export async function loginWithOfflineFallback(
  dispatch: AppDispatch,
  getState: () => RootState,
  payload: LoginPayload
): Promise<{ mode: 'online' | 'offline' }> {
  const emailNormalized = payload.email.trim().toLowerCase();
  const passwordHash = makeOfflinePasswordHash(payload.senha);

  try {
    const response = await apiClient.post<LoginResponse>('/auth/login.php', {
      email: emailNormalized,
      senha: payload.senha,
    });
    if (!response.data.success || !response.data.user) {
      throw new Error(response.data.error || 'Falha no login online');
    }

    dispatch(
      loginSuccessOnline({
        user: response.data.user,
        token: response.data.token ?? null,
        passwordHash,
      })
    );
    return { mode: 'online' };
  } catch {
    const state = getState();
    const local = state.session.offlineCredentialsByEmail[emailNormalized];
    if (!local || local.passwordHash !== passwordHash) {
      throw new Error('Login offline indisponivel para este usuario/senha.');
    }

    dispatch(loginSuccessOffline({ userId: local.userId }));
    return { mode: 'offline' };
  }
}
