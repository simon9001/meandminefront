import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/lib/types';

interface AuthState {
  user:             AuthUser | null;
  initialized:      boolean;
  sessionExpiredAt: number | null; // Unix ms timestamp set when a session expiry is detected
}

const initial: AuthState = {
  user:             null,
  initialized:      false,
  sessionExpiredAt: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser }>) {
      state.user             = action.payload.user;
      state.initialized      = true;
      state.sessionExpiredAt = null; // clear any stale expiry marker on login
    },
    clearCredentials(state) {
      state.user        = null;
      state.initialized = true;
      // Note: sessionExpiredAt is intentionally NOT set here.
      // clearCredentials() is used for deliberate logouts.
      // Use sessionExpired() when the token/session actually expired.
    },
    markInitialized(state) {
      state.initialized = true;
    },
    sessionExpired(state) {
      state.user             = null;
      state.initialized      = true;
      state.sessionExpiredAt = Date.now();
    },
  },
});

export const { setCredentials, clearCredentials, markInitialized, sessionExpired } = authSlice.actions;

export const selectCurrentUser      = (state: { auth: AuthState }) => state.auth.user;
export const selectIsLoggedIn       = (state: { auth: AuthState }) => !!state.auth.user;
export const selectIsInitialized    = (state: { auth: AuthState }) => state.auth.initialized;
export const selectSessionExpiredAt = (state: { auth: AuthState }) => state.auth.sessionExpiredAt;
export const selectIsAdmin          = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'admin' || state.auth.user?.role === 'superadmin';
