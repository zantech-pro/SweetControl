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
  | 'usuarios'
  | 'compras'
  | 'vendas'
  | 'itens_venda'
  | 'movimentacoes_estoque'
  | 'gastos_extras'
  | 'marketing_templates'
  | 'crm_registros'
  | 'pedidos_online'
  | 'recibos_digitais';

type IdMappingEntity = 'categorias_produtos' | 'produtos' | 'clientes' | 'vendas';
type IdMappings = Record<IdMappingEntity, Record<string, number>>;

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
  idMappings: IdMappings;
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
};

const initialIdMappings: IdMappings = {
  categorias_produtos: {},
  produtos: {},
  clientes: {},
  vendas: {},
};

const initialState: SyncQueueState = {
  pendingSync: [],
  idMappings: initialIdMappings,
  isSyncing: false,
  lastSyncAt: null,
  lastSyncError: null,
};

type EnqueuePayload = Omit<PendingSyncItem, 'id' | 'createdAt' | 'attempts' | 'lastError'>;

function ensureIdMappings(value: unknown): IdMappings {
  const fromState = value as Partial<IdMappings> | null | undefined;
  return {
    categorias_produtos: { ...(fromState?.categorias_produtos ?? {}) },
    produtos: { ...(fromState?.produtos ?? {}) },
    clientes: { ...(fromState?.clientes ?? {}) },
    vendas: { ...(fromState?.vendas ?? {}) },
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function toNumericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getMappingEntity(entity: SyncEntity): IdMappingEntity | null {
  if (entity === 'categorias_produtos') return 'categorias_produtos';
  if (entity === 'produtos') return 'produtos';
  if (entity === 'clientes') return 'clientes';
  if (entity === 'vendas') return 'vendas';
  return null;
}

function resolveMappedId(
  rawValue: unknown,
  mappingEntity: IdMappingEntity,
  idMappings: IdMappings
): { resolved: number | null; unresolved: boolean } {
  const numeric = toNumericId(rawValue);
  if (numeric === null) return { resolved: null, unresolved: false };

  const mapped = idMappings[mappingEntity][String(numeric)];
  if (typeof mapped === 'number' && mapped > 0) {
    return { resolved: mapped, unresolved: false };
  }

  // IDs locais antigos podem vir como timestamp positivo (ms) e nao como negativo.
  const looksLikeLocal = numeric < 0 || numeric > 2147483647;
  if (looksLikeLocal) {
    return { resolved: null, unresolved: true };
  }

  return { resolved: numeric, unresolved: false };
}

function preparePayloadForSync(
  item: PendingSyncItem,
  idMappings: IdMappings
): { ok: true; payload: Record<string, unknown> | undefined } | { ok: false; message: string } {
  const rawPayload = asRecord(item.payload);
  const payload = rawPayload ? { ...rawPayload } : undefined;
  if (!payload) return { ok: true, payload: undefined };

  const unresolvedFields: string[] = [];

  const mapField = (field: string, mappingEntity: IdMappingEntity) => {
    if (!(field in payload)) return;

    const { resolved, unresolved } = resolveMappedId(payload[field], mappingEntity, idMappings);
    if (unresolved) {
      unresolvedFields.push(field);
      return;
    }
    if (resolved !== null) {
      payload[field] = resolved;
    }
  };

  mapField('categoria_id', 'categorias_produtos');
  mapField('cliente_id', 'clientes');
  mapField('produto_id', 'produtos');
  mapField('venda_id', 'vendas');
  mapField('referencia_id', 'vendas');

  if (payload.referencia_tipo === 'venda') {
    mapField('referencia_id', 'vendas');
  }

  if ('id' in payload) {
    const mappingEntity = getMappingEntity(item.entity);
    if (mappingEntity) {
      mapField('id', mappingEntity);
    }
  }

  if (unresolvedFields.length > 0) {
    return {
      ok: false,
      message: `Dependencia ainda nao sincronizada: ${unresolvedFields.join(', ')}`,
    };
  }

  return { ok: true, payload };
}

export const processPendingSync = createAsyncThunk<
  { successCount: number; failedCount: number },
  void,
  { state: RootState }
>(
  'syncQueue/processPendingSync',
  async (_, { getState, dispatch }) => {
  
    const {
  syncQueue: { pendingSync, idMappings },
  session,
} = getState();

const safeIdMappings = ensureIdMappings(idMappings);

let successCount = 0;
let failedCount = 0;

// PRIORIDADE DE SINCRONIZAÇÃO
const priority: Record<string, number> = {
  categorias_produtos: 1,
  produtos: 2,
  clientes: 3,
  fornecedores: 4,
  usuarios: 4,
  compras: 5,
  vendas: 5,
  itens_venda: 6,
  movimentacoes_estoque: 7,
  gastos_extras: 8
};



// ORDENA FILA POR DEPENDÊNCIA E DATA
const orderedQueue = [...pendingSync].sort((a, b) => {
  const pa = priority[a.entity] || 99;
  const pb = priority[b.entity] || 99;

  if (pa !== pb) return pa - pb;

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
});



  for (const item of orderedQueue) {
    const prepared = preparePayloadForSync(item, safeIdMappings);
  

    if (!prepared.ok) {
      dispatch(registerSyncFailure({ id: item.id, error: prepared.message }));
      failedCount += 1;
      continue;
    }

    try {
      const knownUsers = session.knownUsers ?? {};
      const user = knownUsers[String(item.usuario_id)];
      const response = await apiClient.request({
        url: item.endpoint,
        method: item.method,
        data: {
          ...(prepared.payload ?? {}),
          usuario_id: item.usuario_id,
        },
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
      });

      

     const preparedPayload = asRecord(prepared.payload);
     const localId = toNumericId(preparedPayload?.local_id);
      const remoteId = toNumericId((response.data as { id?: unknown } | undefined)?.id);
      const mappingEntity = getMappingEntity(item.entity);
      if (
        item.method === 'POST' &&
        mappingEntity &&
        localId !== null &&
        remoteId !== null &&
        remoteId > 0 &&
        localId !== remoteId
      ) {
        dispatch(
          registerIdMapping({
            entity: mappingEntity,
            localId,
            remoteId,
          })
        );
      }

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
    resetSyncRuntimeState: (state) => {
      // Evita lock persistido de execucao apos reinicio do app.
      state.isSyncing = false;
    },
    enqueueSyncItem: {
      reducer: (state, action: PayloadAction<PendingSyncItem>) => {
        // Qualquer nova fila destrava estado antigo de sincronizacao.
        state.isSyncing = false;
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
    registerIdMapping: (
      state,
      action: PayloadAction<{ entity: IdMappingEntity; localId: number; remoteId: number }>
    ) => {
      state.idMappings = ensureIdMappings(state.idMappings);
      state.idMappings[action.payload.entity][String(action.payload.localId)] =
        action.payload.remoteId;
    },
    clearIdMappings: (state) => {
      state.idMappings = {
        categorias_produtos: {},
        produtos: {},
        clientes: {},
        vendas: {},
      };
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
  resetSyncRuntimeState,
  enqueueSyncItem,
  removeSyncItem,
  registerSyncFailure,
  clearSyncQueue,
  registerIdMapping,
  clearIdMappings,
  clearFailedSyncItems,
} =
  syncQueueSlice.actions;
export default syncQueueSlice.reducer;
