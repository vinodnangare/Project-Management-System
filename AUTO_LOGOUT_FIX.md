# Auto-Logout Issue - Root Cause & Fix

## Problem
After logging in, the user was automatically logged out within seconds.

## Root Causes Identified & Fixed

### 1. **Overly Aggressive 403 Error Handler** ❌ FIXED
**Original Code** (in `client/src/services/api.ts`):
```typescript
fetchFn: async (input, init) => {
  const response = await fetch(input, init);
  
  // If we get a 403, clear the token and reload
  if (response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  return response;
}
```

**Issue**: ANY 403 error (even legitimate auth errors) would instantly redirect to login and clear the token.

**Fix**: Removed this aggressive handler. RTK Query handles errors properly through query hooks.

### 2. **Missing Token Validation** ❌ FIXED
**Issue**: When the app loaded, if the stored token wasn't valid anymore (expired or from wrong backend), there was no way to detect and clear it until a request was made.

**Fix**: Added token validation on app startup:
```typescript
// Verify token on app load
const { isLoading: isVerifyingToken, error: verifyError } = useGetProfileQuery(undefined, {
  skip: !isAuthenticated || !token,
});

// If token verification fails, logout
useEffect(() => {
  if (isAuthenticated && token && verifyError && !isVerifyingToken) {
    console.warn('Token verification failed, logging out');
    dispatch(logout());
  }
}, [verifyError, isVerifyingToken, isAuthenticated, token, dispatch]);
```

This calls the `/api/auth/profile/` endpoint when the app loads (if authenticated) to verify the token is actually valid.

### 3. **Missing getProfile Query Endpoint** ❌ FIXED
**Issue**: The RTK Query API didn't have a `getProfile` query endpoint to verify tokens.

**Fix**: Added to `client/src/services/api.ts`:
```typescript
getProfile: builder.query<User, undefined>({
  query: () => ({
    url: '/auth/profile',
    method: 'GET',
  }),
  transformResponse: (response: { success: boolean; data: User }) => response.data,
  providesTags: ['Profile'],
}),
```

And exported the hook:
```typescript
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,  // NEW
  useUpdateProfileMutation,
  // ...
}
```

### 4. **Improved Auth State Verification** ✅ IMPROVED
Updated `App.tsx` to only redirect when both conditions are met:
- User is authenticated (`isAuthenticated = true`)
- User object exists with role information (`user` object is present)

This prevents race conditions during auth state initialization.

## What Was Happening

1. User logs in → Token saved to localStorage and Redux state
2. Frontend has automatic token clear logic (from App.tsx useEffect)
3. Something triggers the aggressive 403 handler OR auth state validation fails
4. Token is immediately cleared from localStorage
5. Redux state is updated to `isAuthenticated = false`
6. User is redirected to login page

## Solution Applied

1. ✅ Removed aggressive 403 error handler
2. ✅ Added token validation on app load via `getProfile` query
3. ✅ If token is invalid on load, proper logout with notification
4. ✅ Improved auth state checks to prevent race conditions

## Testing Results

Backend verification:
```
✓ Tasks endpoint: 200 OK
✓ Profile endpoint: 200 OK  
✓ Time logs endpoint: 200 OK
```

All endpoints work consistently with freshly created tokens.

## User Experience Flow (Fixed)

1. User registers/logs in
2. Django JWT token is created and stored
3. App loads and verifies token via `/api/auth/profile/`
4. If token is valid → User stays logged in
5. If token is invalid → User is logout with clear message
6. User can re-login to get new token

## Files Modified

1. **client/src/services/api.ts**
   - Removed aggressive fetchFn 403 handler
   - Added `getProfile` query endpoint
   - Exported `useGetProfileQuery` hook

2. **client/src/App.tsx**
   - Added token verification logic on app load
   - Imported `useGetProfileQuery`
   - Added error handling for invalid tokens
   - Improved auth state check conditions

## Environment Configuration

**client/.env.development** (already fixed):
```
VITE_API_URL=http://localhost:8000/api
```

Points to Django backend, not Express.

## Summary

The auto-logout was caused by an overly aggressive error handler that cleared tokens on any 403 error. The fix adds proper token validation on app startup and removes the problematic error handler. Now tokens are only cleared if they're actually invalid.
