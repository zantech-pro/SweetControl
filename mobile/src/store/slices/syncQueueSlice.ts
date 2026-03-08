import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { apiClient } from '../../api/client';
import { RootState } from '../index';

type SyncMethod = 'POST' | 'PUT' | 'DELETE';
type SyncEntity =
  | 'categorias_produtos'
  | 'produtos'
  | 'clientes'
  | 'fornecedores'
  | 'vendas'
  | 'itens_venda'
  | 'movimentacoes_estoque'
  | 'gastos_extras'
  | 'marketing_templates'
  | 'crm_registros'
  | 'pedidos_online'
  | 'recibos_digitais';

export type PendingSyncItem = {
  id: string;
  usuario_id: number;
  method: SyncMethod;
  endpoint: string;
  entity: SyncEntity;
  payload?: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError: string | null;
};

type SyncQueueState = {
  pendingSync: PendingSyncItem[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
};

const initialState: SyncQueueState = {
  pendingSync: [],
  isSyncing: false,
  lastSyncAt: null,
  lastSyncError: null,
};

type EnqueuePayload = Omit<PendingSyncItem, 'id' | 'createdAt' | 'attempts' | 'lastError'>;

export const processPendingSync = createAsyncThunk<
  { successCount: number; failedCount: number },
  void,
  { state: RootState }
>(
  'syncQueue/processPendingSync',
  async (_, { getState, dispatch }) => {
  const {
    syncQueue: { pendingSync },
    session,
  } = getState();

  let successCount = 0;
  let failedCount = 0;

  for (const item of pendingSync) {
    try {
      const knownUsers = session.knownUsers ?? {};
      const user = knownUsers[String(item.usuario_id)];
      await apiClient.request({
        url: item.endpoint,
        method: item.method,
        data: {
          ...(item.payload ?? {}),
          usuario_id: item.usuario_id,
        },
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
      });

      dispatch(removeSyncItem(item.id));
      successCount += 1;
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Falha de sincronizacao';
      if (error instanceof AxiosError) {
        const data = error.response?.data as
          | { error?: string; details?: string }
          | undefined;
        const status = error.response?.status;
        if (data?.error) {
          message = status
            ? `${status} - ${data.error}${data.details ? ` | ${data.details}` : ''}`
            : `${data.error}${data.details ? ` | ${data.details}` : ''}`;
        } else if (status) {
          message = `${status} - ${error.message}`;
        }
      }
      dispatch(registerSyncFailure({ id: item.id, error: message }));
      failedCount += 1;
    }
  }

  return { successCount, failedCount };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      if (!state.session.isAuthenticated) return false;
      if (state.syncQueue.isSyncing) return false;
      if (state.syncQueue.pendingSync.length === 0) return false;
      return true;
    },
  }
);

export const syncQueueSlice = createSlice({
  name: 'syncQueue',
  initialState,
  reducers: {
    enqueueSyncItem: {
      reducer: (state, action: PayloadAction<PendingSyncItem>) => {
        state.pendingSync.push(action.payload);
      },
      prepare: (payload: EnqueuePayload) => ({
        payload: {
          ...payload,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          attempts: 0,
          lastError: null,
        } satisfies PendingSyncItem,
      }),
    },
    removeSyncItem: (state, action: PayloadAction<string>) => {
      state.pendingSync = state.pendingSync.filter((item) => item.id !== action.payload);
    },
    registerSyncFailure: (
      state,
      action: PayloadAction<{ id: string; error: string }>
    ) => {
      const item = state.pendingSync.find((current) => current.id === action.payload.id);
      if (!item) return;

      item.attempts += 1;
      item.lastError = action.payload.error;
    },
    clearSyncQueue: (state) => {
      state.pendingSync = [];
    },
    clearFailedSyncItems: (state) => {
      state.pendingSync = state.pendingSync.filter((item) => item.attempts === 0);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(processPendingSync.pending, (state) => {
      state.isSyncing = true;
      state.lastSyncError = null;
    });
    builder.addCase(processPendingSync.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.lastSyncAt = new Date().toISOString();
      state.lastSyncError =
        action.payload.failedCount > 0
          ? `${action.payload.failedCount} item(ns) falharam na sincronizacao.`
          : null;
    });
    builder.addCase(processPendingSync.rejected, (state, action) => {
      state.isSyncing = false;
      state.lastSyncError = action.error.message ?? 'Erro geral de sincronizacao.';
    });
  },
});

export const {
  enqueueSyncItem,
  removeSyncItem,
  registerSyncFailure,
  clearSyncQueue,
  clearFailedSyncItems,
} =
  syncQueueSlice.actions;
export default syncQueueSlice.reducer;
