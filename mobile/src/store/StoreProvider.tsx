// src/store/StoreProvider.tsx
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './index';
import { runSyncCycle } from './syncService';

function AutoSyncManager() {
  useEffect(() => {
    const runOnce = () => {
      void runSyncCycle(store.dispatch, store.getState);
    };

    const timeoutId = setTimeout(runOnce, 1500);
    const intervalId = setInterval(runOnce, 30000);
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        runOnce();
      }
    });

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      sub.remove();
    };
  }, []);

  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AutoSyncManager />
        {children}
      </PersistGate>
    </Provider>
  );
}
