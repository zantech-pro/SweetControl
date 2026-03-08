import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SessionState = {
  usuarioId: number | null;
  token: string | null;
  isAuthenticated: boolean;
};

const initialState: SessionState = {
  usuarioId: null,
  token: null,
  isAuthenticated: false,
};

type SessionPayload = {
  usuarioId: number;
  token?: string | null;
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<SessionPayload>) => {
      state.usuarioId = action.payload.usuarioId;
      state.token = action.payload.token ?? null;
      state.isAuthenticated = true;
    },
    clearSession: () => initialState,
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;

