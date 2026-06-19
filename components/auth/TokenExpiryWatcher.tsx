'use client';

// Auth tokens are now stored in httpOnly cookies — JS cannot inspect them.
// Proactive JWT expiry watching is no longer possible here.
// The baseApi's baseQueryWithReauth handles 401s and silently refreshes the cookie.
export function TokenExpiryWatcher() {
  return null;
}
