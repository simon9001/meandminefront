import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/lib/types';

interface AuthState {
  user:         AuthUser | null;
  token:        string | null;
  refreshToken: string | null;
  initialized:  boolean;
}

const initial: AuthState = {
  user:         null,
  token:        null,
  refreshToken: null,
  initialized:  false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string; refreshToken?: string }>) {
      state.user         = action.payload.user;
      state.token        = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
      state.initialized  = true;
      // Keep localStorage in sync so legacy apiFetch helpers still work
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', action.payload.token);
        if (action.payload.refreshToken) localStorage.setItem('refresh_token', action.payload.refreshToken);
      }
    },
    clearCredentials(state) {
      state.user         = null;
      state.token        = null;
      state.refreshToken = null;
      state.initialized  = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    },
    markInitialized(state) {
      state.initialized = true;
    },
  },
});

export const { setCredentials, clearCredentials, markInitialized } = authSlice.actions;

// Selectors
export const selectCurrentUser   = (state: { auth: AuthState }) => state.auth.user;
export const selectToken         = (state: { auth: AuthState }) => state.auth.token;
export const selectRefreshToken  = (state: { auth: AuthState }) => state.auth.refreshToken;
export const selectIsLoggedIn    = (state: { auth: AuthState }) => !!state.auth.user;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.initialized;
export const selectIsAdmin       = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'admin' || state.auth.user?.role === 'superadmin';
