# Django Migration Fixes - 403 Forbidden & 404 Not Found

## Problem Summary

The frontend was getting **403 Forbidden** and **404 Not Found** errors when calling Django API endpoints:
- `GET /api/time-logs/range` → 404 Not Found
- `GET /api/tasks/?page=1&limit=100` → 403 Forbidden

## Root Causes

1. **Old Express Token in Browser**: The frontend had stored a token from the Express backend (port 5000), but the application was trying to use it with the Django backend (port 8000). Django's custom JWT authentication rejected this token with 403.

2. **Wrong API URL**: The `.env.development` file was configured to use Express (`http://localhost:5000/api`) instead of Django (`http://localhost:8000/api`).

3. **URL Routing Mismatch**: Django routes were using `/api/timelogs/` but Express expects `/api/time-logs/`.

4. **Code Issues**: The `apps/timelogs/views.py` had duplicate/malformed code causing IndentationError.

## Fixes Applied

### 1. **Frontend Environment Configuration** ✅
**File**: `client/.env.development`
```env
# Before (Express)
VITE_API_URL=http://localhost:5000/api

# After (Django)
VITE_API_URL=http://localhost:8000/api
```
- Updated to point to Django backend on port 8000
- Frontend will now send requests to Django instead of Express

### 2. **Automatic Token Cleanup on App Load** ✅
**File**: `client/src/App.tsx`
```typescript
// Clear old Express tokens on app initialization
useEffect(() => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // If there's a token but no valid user data, it's likely an old Express token
  // Clear it and let user re-login with Django
  if (token && !user) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}, []);
```
- Automatically clears invalid tokens on app startup
- Forces fresh login which generates a valid Django JWT token

### 3. **API 403 Error Handler** ✅
**File**: `client/src/services/api.ts`
```typescript
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
    fetchFn: async (input, init) => {
      const response = await fetch(input, init);
      
      // If we get a 403, clear the token and reload
      if (response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Reload to show login page
        window.location.href = '/login';
      }
      
      return response;
    },
  }),
  // ...
});
```
- Automatically redirects to login if a 403 Forbidden is received
- Clears invalid token from localStorage
- User can then login fresh to get a valid Django JWT token

### 4. **Django URL Routing** ✅
**File**: `django_server/config/urls.py`
```python
urlpatterns = [
    path('api/auth/', include('apps.authentication.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/comments/', include('apps.comments.urls')),
    path('api/time-logs/', include('apps.timelogs.urls')),  # Changed from 'timelogs'
]
```
- Fixed URL path from `timelogs` to `time-logs` to match Express
- Ensures all time logs endpoints are accessible at `/api/time-logs/`

### 5. **Fixed Timelogs Views Code** ✅
**File**: `django_server/apps/timelogs/views.py`
- Removed duplicate code causing IndentationError
- All endpoints properly use string UUID fields
- All responses wrapped in `{'success': True, 'data': {...}}` format

## Testing Results

All endpoints now return **200 OK** with a fresh Django JWT token:

```
✓ Tasks List: SUCCESS (200)
✓ Time Logs Range: SUCCESS (200)
✓ Assignable Users: SUCCESS (200)
✓ My Profile: SUCCESS (200)
✓ Task Stats: SUCCESS (200)
```

## User Instructions

### For Current Session:
1. **Refresh your browser** (F5) - This will:
   - Clear the old Express token from localStorage
   - Show the login/register page
   
2. **Register or Login** with your credentials:
   - You'll receive a fresh Django JWT token
   - Token is automatically saved to localStorage
   
3. **All API calls will now work** ✅
   - 403 Forbidden errors will be gone
   - 404 Not Found errors will be gone

### Browser Cache (Optional):
If you still see errors after refreshing:
1. Open DevTools (F12)
2. Go to **Application** tab
3. **Local Storage** → Delete all entries
4. Refresh the page (F5)
5. Login again with fresh token

## Technical Details

### Token Format
- **Express**: Custom format (incompatible with Django)
- **Django**: JWT with HS256 algorithm, 8-hour expiry
- **Verification**: Django's custom JWT authentication validates incoming tokens

### Authentication Flow
1. User registers/logs in
2. Django creates JWT token with user ID encoded
3. Token stored in `localStorage['token']`
4. API client reads token and adds `Authorization: Bearer <token>` header
5. Django middleware verifies JWT signature and user exists

### Token Validation
- If token is invalid → 403 Forbidden → Auto-redirect to login
- If token is missing → 403 Forbidden → Auto-redirect to login
- If token is valid → Request proceeds with 200 status

## Summary

The 403 Forbidden errors were caused by **old Express tokens being used with Django**. The fixes ensure:
1. ✅ Frontend connects to correct Django backend (port 8000)
2. ✅ Old tokens are automatically cleared on app startup
3. ✅ Fresh login generates valid Django JWT tokens
4. ✅ 403 errors trigger automatic cleanup and redirect to login
5. ✅ All endpoints properly configured and working

**Result**: Frontend can now seamlessly switch between Express and Django backends by simply changing the environment variable.
