import reducer, {
  loginSuccessOffline,
  loginSuccessOnline,
  logout,
  switchActiveUser,
} from './sessionSlice';

describe('sessionSlice', () => {
  it('should login online and persist known user data', () => {
    const state = reducer(
      undefined,
      loginSuccessOnline({
        user: { id: 1, nome: 'Simone', email: 'simone@email.com' },
        token: 'token-1',
        passwordHash: 'hash-1',
      })
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.activeUserId).toBe(1);
    expect(state.knownUsers['1'].email).toBe('simone@email.com');
    expect(state.offlineCredentialsByEmail['simone@email.com'].passwordHash).toBe('hash-1');
  });

  it('should switch active user only if user exists', () => {
    const onlineState = reducer(
      undefined,
      loginSuccessOnline({
        user: { id: 1, nome: 'Simone', email: 'simone@email.com' },
        token: 'token-1',
        passwordHash: 'hash-1',
      })
    );
    const switched = reducer(onlineState, switchActiveUser(2));
    expect(switched.activeUserId).toBe(1);
  });

  it('should login offline with known user id and logout', () => {
    const logged = reducer(undefined, loginSuccessOffline({ userId: 1 }));
    expect(logged.isAuthenticated).toBe(true);
    expect(logged.activeUserId).toBe(1);

    const afterLogout = reducer(logged, logout());
    expect(afterLogout.isAuthenticated).toBe(false);
    expect(afterLogout.activeUserId).toBeNull();
  });
});

