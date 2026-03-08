import { AppDispatch } from './index';
import { processPendingSync } from './slices/syncQueueSlice';

export async function runSyncCycle(dispatch: AppDispatch) {
  const resultAction = await dispatch(processPendingSync());
  return resultAction;
}

