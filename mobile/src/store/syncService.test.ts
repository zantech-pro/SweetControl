import { runSyncCycle } from './syncService';

describe('syncService', () => {
  it('should not dispatch sync when guard conditions are not met', async () => {
    const dispatch = jest.fn();
    const result = await runSyncCycle(
      dispatch as never,
      () =>
        ({
          session: { isAuthenticated: false },
          syncQueue: { isSyncing: false, pendingSync: [{ id: '1' }] },
        } as never)
    );

    expect(result).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch processPendingSync when conditions are met', async () => {
    const dispatch = jest.fn().mockResolvedValue({ type: 'ok' });
    const result = await runSyncCycle(
      dispatch as never,
      () =>
        ({
          session: { isAuthenticated: true },
          syncQueue: { isSyncing: false, pendingSync: [{ id: '1' }] },
        } as never)
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toEqual(expect.any(Function));
    expect(result).toEqual({ type: 'ok' });
  });
});
