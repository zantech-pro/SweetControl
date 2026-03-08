import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themeReducer from './slices/themeSlice';
import sessionReducer from './slices/sessionSlice';
import referenceDataReducer from './slices/referenceDataSlice';
import syncQueueReducer from './slices/syncQueueSlice';
import businessReducer from './slices/businessSlice';

const rootReducer = combineReducers({
  theme: themeReducer,
  session: sessionReducer,
  referenceData: referenceDataReducer,
  syncQueue: syncQueueReducer,
  business: businessReducer,
});

const persistConfig = {
  key: 'sweetcontrol_root',
  storage: AsyncStorage,
  whitelist: ['theme', 'session', 'referenceData', 'syncQueue', 'business'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  reducer: persistedReducer,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
