import reducer, {
  clearFailedSyncItems,
  enqueueSyncItem,
  registerSyncFailure,
} from './syncQueueSlice';

describe('syncQueueSlice', () => {
  it('should enqueue item with generated metadata', () => {
    const state = reducer(
      undefined,
      enqueueSyncItem({
        usuario_id: 1,
        entity: 'produtos',
        endpoint: '/produtos/create.php',
        method: 'POST',
        payload: { nome: 'Bolo' },
      })
    );

    expect(state.pendingSync).toHaveLength(1);
    expect(state.pendingSync[0].attempts).toBe(0);
    expect(state.pendingSync[0].lastError).toBeNull();
  });

  it('should clear only failed items', () => {
    const enqueued = reducer(
      undefined,
      enqueueSyncItem({
        usuario_id: 1,
        entity: 'produtos',
        endpoint: '/produtos/create.php',
        method: 'POST',
        payload: { nome: 'Bolo' },
      })
    );
    const firstId = enqueued.pendingSync[0].id;
    const failed = reducer(
      enqueued,
      registerSyncFailure({ id: firstId, error: '500 - Falha ao criar produto' })
    );

    const mixed = reducer(
      failed,
      enqueueSyncItem({
        usuario_id: 1,
        entity: 'clientes',
        endpoint: '/clientes/create.php',
        method: 'POST',
        payload: { nome: 'Cliente' },
      })
    );

    const cleaned = reducer(mixed, clearFailedSyncItems());
    expect(cleaned.pendingSync).toHaveLength(1);
    expect(cleaned.pendingSync[0].entity).toBe('clientes');
    expect(cleaned.pendingSync[0].attempts).toBe(0);
  });
});

