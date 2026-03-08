import { AppDispatch, RootState } from './index';
import { processPendingSync } from './slices/syncQueueSlice';

export async function runSyncCycle(
  dispatch: AppDispatch,
  getState?: () => RootState
) {
  const state = getState?.();
  if (state) {
    const canSync =
      state.session.isAuthenticated &&
      !state.syncQueue.isSyncing &&
      state.syncQueue.pendingSync.length > 0;
    if (!canSync) {
      return null;
    }
  }

  const resultAction = await dispatch(processPendingSync());
  return resultAction;
}
