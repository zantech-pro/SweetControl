import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type KnownUser = {
  id: number;
  nome: string;
  email: string;
  token: string | null;
  lastOnlineLoginAt: string;
};

type OfflineCredential = {
  userId: number;
  passwordHash: string;
  lastValidatedAt: string;
};

type SessionState = {
  activeUserId: number | null;
  isAuthenticated: boolean;
  knownUsers: Record<string, KnownUser>;
  offlineCredentialsByEmail: Record<string, OfflineCredential>;
};

const initialState: SessionState = {
  activeUserId: null,
  isAuthenticated: false,
  knownUsers: {},
  offlineCredentialsByEmail: {},
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    loginSuccessOnline: (
      state,
      action: PayloadAction<{
        user: { id: number; nome: string; email: string };
        token?: string | null;
        passwordHash: string;
      }>
    ) => {
      const user = action.payload.user;
      const nowIso = new Date().toISOString();
      state.activeUserId = user.id;
      state.isAuthenticated = true;
      state.knownUsers[String(user.id)] = {
        id: user.id,
        nome: user.nome,
        email: user.email.toLowerCase(),
        token: action.payload.token ?? null,
        lastOnlineLoginAt: nowIso,
      };
      state.offlineCredentialsByEmail[user.email.toLowerCase()] = {
        userId: user.id,
        passwordHash: action.payload.passwordHash,
        lastValidatedAt: nowIso,
      };
    },
    loginSuccessOffline: (state, action: PayloadAction<{ userId: number }>) => {
      state.activeUserId = action.payload.userId;
      state.isAuthenticated = true;
    },
    switchActiveUser: (state, action: PayloadAction<number>) => {
      const exists = !!state.knownUsers[String(action.payload)];
      if (!exists) return;
      state.activeUserId = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.activeUserId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccessOnline, loginSuccessOffline, switchActiveUser, logout } =
  sessionSlice.actions;
export default sessionSlice.reducer;
