import { loginWithOfflineFallback } from './authService';
import { apiClient } from '../api/client';
import { makeOfflinePasswordHash } from './passwordHash';
import { loginSuccessOffline, loginSuccessOnline } from './slices/sessionSlice';

jest.mock('../api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('authService', () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login online when API succeeds', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        token: 'token-1',
        user: { id: 1, nome: 'Simone', email: 'simone@email.com' },
      },
    });

    const result = await loginWithOfflineFallback(
      dispatch as never,
      () =>
        ({
          session: { offlineCredentialsByEmail: {} },
        } as never),
      { email: 'simone@email.com', senha: 'Senha@123' }
    );

    expect(result.mode).toBe('online');
    expect(dispatch).toHaveBeenCalledWith(
      loginSuccessOnline({
        user: { id: 1, nome: 'Simone', email: 'simone@email.com' },
        token: 'token-1',
        passwordHash: makeOfflinePasswordHash('Senha@123'),
      })
    );
  });

  it('should fallback to offline login when API fails and cached credentials match', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await loginWithOfflineFallback(
      dispatch as never,
      () =>
        ({
          session: {
            offlineCredentialsByEmail: {
              'simone@email.com': {
                userId: 7,
                passwordHash: makeOfflinePasswordHash('Senha@123'),
                lastValidatedAt: new Date().toISOString(),
              },
            },
          },
        } as never),
      { email: 'simone@email.com', senha: 'Senha@123' }
    );

    expect(result.mode).toBe('offline');
    expect(dispatch).toHaveBeenCalledWith(loginSuccessOffline({ userId: 7 }));
  });

  it('should throw when offline credentials are not available', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('network'));

    await expect(
      loginWithOfflineFallback(
        dispatch as never,
        () => ({ session: { offlineCredentialsByEmail: {} } } as never),
        { email: 'none@email.com', senha: 'Senha@123' }
      )
    ).rejects.toThrow('Login offline indisponivel para este usuario/senha.');
  });
});

