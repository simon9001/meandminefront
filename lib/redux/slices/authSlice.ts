import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/lib/types';

interface AuthState {
  user:        AuthUser | null;
  initialized: boolean;
}

const initial: AuthState = {
  user:        null,
  initialized: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser }>) {
      state.user        = action.payload.user;
      state.initialized = true;
    },
    clearCredentials(state) {
      state.user        = null;
      state.initialized = true;
    },
    markInitialized(state) {
      state.initialized = true;
    },
  },
});

export const { setCredentials, clearCredentials, markInitialized } = authSlice.actions;

export const selectCurrentUser   = (state: { auth: AuthState }) => state.auth.user;
export const selectIsLoggedIn    = (state: { auth: AuthState }) => !!state.auth.user;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.initialized;
export const selectIsAdmin       = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'admin' || state.auth.user?.role === 'superadmin';
