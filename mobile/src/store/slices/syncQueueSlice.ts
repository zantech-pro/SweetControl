import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
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
>('syncQueue/processPendingSync', async (_, { getState, dispatch }) => {
  const {
    syncQueue: { pendingSync },
    session,
  } = getState();

  let successCount = 0;
  let failedCount = 0;

  for (const item of pendingSync) {
    try {
      await apiClient.request({
        url: item.endpoint,
        method: item.method,
        data: item.payload,
        headers: session.token ? { Authorization: `Bearer ${session.token}` } : undefined,
      });

      dispatch(removeSyncItem(item.id));
      successCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha de sincronizacao';
      dispatch(registerSyncFailure({ id: item.id, error: message }));
      failedCount += 1;
    }
  }

  return { successCount, failedCount };
});

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

export const { enqueueSyncItem, removeSyncItem, registerSyncFailure, clearSyncQueue } =
  syncQueueSlice.actions;
export default syncQueueSlice.reducer;
