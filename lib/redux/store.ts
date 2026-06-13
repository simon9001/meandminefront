import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import { authSlice } from './slices/authSlice';
import { baseApi } from './api/baseApi';

// SSR-safe storage: returns a noop on the server, real localStorage on the client
function createStorage() {
  if (typeof window !== 'undefined') {
    return createWebStorage('local');
  }
  return {
    getItem:    (_key: string) => Promise.resolve(null),
    setItem:    (_key: string, _value: string) => Promise.resolve(),
    removeItem: (_key: string) => Promise.resolve(),
  };
}

const persistConfig = {
  key:       'maschon',
  storage:   createStorage(),
  whitelist: ['auth'],          // only auth state is persisted; API cache is always fresh
};

const rootReducer = combineReducers({
  auth:              authSlice.reducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);

// Enables refetchOnFocus and refetchOnReconnect for all RTK Query endpoints
setupListeners(store.dispatch);

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
