# JWT Authentication Implementation Summary

## Overview
The JWT authentication system for AgroLynk has been fully implemented with proper token generation, storage, and request attachment. This document summarizes all changes made and how to use the authentication system.

---

## Files Created

### 1. Authentication Context
**File**: `client/src/context/AuthContext.tsx`

Provides global authentication state management using React Context.

**Features**:
- Stores JWT token in localStorage
- Automatically decodes token to extract userId and role
- Detects token expiration
- Provides `useAuth()` hook for accessing auth state anywhere
- Handles login and logout operations

**Usage**:
```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { isAuthenticated, user, token, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Not logged in</p>;
  }
  
  return <p>Welcome, {user?.role}!</p>;
}
```

### 2. Protected Route Component
**File**: `client/src/components/ProtectedRoute.tsx`

Wrapper component for protecting routes with authentication and role-based access control.

**Features**:
- Redirects unauthenticated users to login
- Enforces role-based access control
- Shows loading state while checking authentication
- Displays access denied message for unauthorized roles

**Usage**:
```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Protect a route
<ProtectedRoute>
  <FarmerDashboard />
</ProtectedRoute>

// Protect a route with role requirement
<ProtectedRoute allowedRoles={["farmer"]}>
  <FarmerOnlyFeature />
</ProtectedRoute>
```

### 3. Logout Button Component
**File**: `client/src/components/LogoutButton.tsx`

Displays user role and logout button when authenticated.

**Features**:
- Shows current user role
- Logout button that clears token and redirects
- Only displays when user is authenticated

**Usage**:
```typescript
import { LogoutButton } from "@/components/LogoutButton";

// In navbar or header
<LogoutButton />
```

### 4. Authenticated Fetch Utilities
**File**: `client/src/hooks/useAuthenticatedFetch.ts`

Hook and utility functions for making authenticated API requests.

**Features**:
- `useAuthenticatedFetch()` hook for React components
- `authenticatedGet()`, `authenticatedPost()`, `authenticatedPatch()`, `authenticatedDelete()` utilities
- Automatic Authorization header attachment
- Automatic logout on 401 responses

**Usage**:
```typescript
// Using hook in component
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

function MyComponent() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const handleClick = async () => {
    const response = await authenticatedFetch("/api/protected", {
      method: "POST",
      body: JSON.stringify({ data: "value" })
    });
    const data = await response.json();
  };
}

// Using utility functions
import { authenticatedGet, authenticatedPost } from "@/hooks/useAuthenticatedFetch";

const token = localStorage.getItem("authToken");
const response = await authenticatedPost("/api/data", { id: 1 }, token);
```

---

## Files Modified

### 1. Login Page
**File**: `client/src/pages/Login.tsx`

**Changes Made**:
- Changed endpoint from `/api/login` to `/api/auth/login` ✅
- Changed request field from `username` to `email` ✅
- Extract JWT token from response ✅
- Use `login()` from AuthContext to store token ✅
- Decode token to get user role and navigate accordingly ✅

**Before**:
```typescript
const response = await fetch("/api/login", {
  body: JSON.stringify({ username: email, password })
});
// Token never stored, navigation fails
```

**After**:
```typescript
const response = await fetch("/api/auth/login", {
  body: JSON.stringify({ email, password })
});
const data = await response.json();
if (data.token) {
  login(data.token); // Store in AuthContext + localStorage
  // Navigate based on role
}
```

### 2. Query Client
**File**: `client/src/lib/queryClient.ts`

**Changes Made**:
- `apiRequest()` function now includes Authorization header ✅
- `getQueryFn()` function now includes Authorization header ✅
- Removed `credentials: "include"` (for cookies, not JWT) ✅
- Handle 401 responses by clearing token ✅

**Before**:
```typescript
export async function apiRequest(method, url, data) {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    credentials: "include", // Wrong for JWT
    // No Authorization header
  });
}
```

**After**:
```typescript
export async function apiRequest(method, url, data) {
  const token = localStorage.getItem("authToken");
  const headers = {
    ...(data && { "Content-Type": "application/json" }),
    ...(token && { "Authorization": `Bearer ${token}` }),
  };
  
  const res = await fetch(url, { method, headers, body: data ? JSON.stringify(data) : undefined });
  
  if (res.status === 401) {
    localStorage.removeItem("authToken"); // Clear on unauthorized
  }
}
```

### 3. App Component
**File**: `client/src/App.tsx`

**Changes Made**:
- Wrapped entire app with `<AuthProvider>` ✅
- AuthProvider is outermost provider for global auth state

**Before**:
```typescript
<LanguageProvider>
  <QueryClientProvider>
    {/* Routes */}
  </QueryClientProvider>
</LanguageProvider>
```

**After**:
```typescript
<AuthProvider>  {/* NEW - Outermost provider */}
  <LanguageProvider>
    <QueryClientProvider>
      {/* Routes */}
    </QueryClientProvider>
  </LanguageProvider>
</AuthProvider>
```

### 4. Navbar Component
**File**: `client/src/components/Navbar.tsx`

**Changes Made**:
- Import `LogoutButton` and `useAuth` ✅
- Display LogoutButton when authenticated ✅
- Display Login button when not authenticated ✅
- Updated both desktop and mobile navigation

**Before**:
```typescript
<Button asChild>
  <a href="#login">{t.navigation.login}</a>
</Button>
```

**After**:
```typescript
{isAuthenticated ? (
  <LogoutButton />
) : (
  <Button asChild>
    <Link href="/login">{t.navigation.login}</Link>
  </Button>
)}
```

---

## Server-Side (Already Correct ✅)

The server-side JWT implementation was already correct and required no changes:

### `/api/auth/login` Endpoint
- Validates email and password
- Generates JWT with userId and role
- Sets expiration to 7 days
- Returns `{ token: "..." }`

### `requireAuth` Middleware
- Extracts token from `Authorization: Bearer <token>` header
- Verifies JWT signature and expiration
- Attaches `req.user` with decoded payload
- Returns 401 on invalid/expired token

### `requireRole` Middleware
- Checks if user role is in allowed list
- Returns 403 if unauthorized
- Works seamlessly with requireAuth

---

## Authentication Flow (Complete End-to-End)

### Step 1: User Logs In
```
Frontend (Login.tsx)
  ↓
POST /api/auth/login { email, password }
  ↓
Backend Validation
  ↓
JWT Generation (userId, role, 7-day expiration)
  ↓
Response: { token: "eyJhbGciOi..." }
  ↓
Frontend Receives Token
  ↓
login() → AuthContext + localStorage
  ↓
Navigate to /farmer/options or /company/options
```

### Step 2: User Makes API Request
```
Frontend (Any Component)
  ↓
apiRequest("GET", "/api/listings/mine", ...)
  ↓
Retrieve token: localStorage.getItem("authToken")
  ↓
Add header: Authorization: Bearer <token>
  ↓
POST request with Authorization header
  ↓
Backend Receives Request
  ↓
requireAuth middleware
  ↓
Extract token from Authorization header
  ↓
jwt.verify(token, JWT_SECRET)
  ↓
Attach req.user = { userId, role }
  ↓
Route handler executes with req.user available
  ↓
Response with data or 401/403 errors
```

### Step 3: User Logs Out
```
Frontend (LogoutButton)
  ↓
Click Logout
  ↓
logout() from AuthContext
  ↓
Remove from localStorage
  ↓
Clear state: token = null, user = null
  ↓
Navigate to /login
```

---

## Directory Structure

```
client/src/
├── context/
│   └── AuthContext.tsx          (NEW) Global auth state + useAuth hook
├── components/
│   ├── ProtectedRoute.tsx       (NEW) Route protection component
│   ├── LogoutButton.tsx         (NEW) Logout UI component
│   ├── Navbar.tsx               (MODIFIED) Added auth UI
│   └── ... (other components)
├── hooks/
│   ├── useAuthenticatedFetch.ts (NEW) Auth fetch utilities
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── lib/
│   ├── queryClient.ts           (MODIFIED) Auth header attachment
│   └── utils.ts
├── pages/
│   ├── Login.tsx                (MODIFIED) Token storage & AuthContext
│   └── ... (other pages)
├── App.tsx                      (MODIFIED) AuthProvider wrapper
└── ... (other files)
```

---

## How to Use in Components

### Example 1: Check Authentication Status
```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;
  
  return <div>Welcome, {user?.role}!</div>;
}
```

### Example 2: Make Authenticated Request
```typescript
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { token } = useAuth();
  
  const handleFetch = async () => {
    const response = await apiRequest("GET", "/api/protected");
    const data = await response.json();
    console.log(data);
  };
}
```

### Example 3: Protect a Route
```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

<Route path="/farmer/dashboard">
  <ProtectedRoute allowedRoles={["farmer"]}>
    <FarmerDashboard />
  </ProtectedRoute>
</Route>
```

### Example 4: Logout
```typescript
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

function LogoutComponent() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

---

## Testing the Implementation

### Quick Test (Browser Console)
```javascript
// Check if token is stored
console.log(localStorage.getItem("authToken"));

// Decode token
const token = localStorage.getItem("authToken");
const payload = JSON.parse(atob(token.split('.')[1]));
console.log("User ID:", payload.userId);
console.log("Role:", payload.role);
console.log("Expires:", new Date(payload.exp * 1000));

// Check network requests
// 1. Open DevTools → Network tab
// 2. Make any API request
// 3. Inspect the request → Headers
// 4. Verify "Authorization: Bearer ..." header is present
```

### Verification Checklist
- [ ] Can login with email and password
- [ ] Token is stored in localStorage after login
- [ ] Token appears in Authorization header in API requests
- [ ] Can access protected routes
- [ ] Cannot access routes with insufficient role
- [ ] Logout clears token and redirects
- [ ] Expired token triggers re-login
- [ ] LogoutButton shows in navbar when authenticated

---

## Key Security Considerations

### ✅ What's Secure
- JWT signature verification prevents token tampering
- Token expiration (7 days) limits exposure of leaked tokens
- Bcrypt password hashing in database
- Role-based access control on backend
- Bearer token in Authorization header (standard JWT practice)

### ⚠️ Potential Improvements
- Implement refresh token endpoint (separate endpoint for token refresh)
- Migrate to httpOnly cookies (prevents XSS access to token)
- Add rate limiting on login endpoint (brute force protection)
- Implement token rotation on sensitive operations
- Add comprehensive audit logging for auth events
- Use HTTPS everywhere in production

### 🔒 For Production
1. Set JWT_SECRET in environment variables (never hardcode)
2. Implement proper CORS headers for production domain only
3. Use HTTPS/TLS for all communication
4. Implement rate limiting on authentication endpoints
5. Add Content Security Policy (CSP) headers
6. Monitor for unusual authentication patterns
7. Implement refresh token strategy for long sessions
8. Regular security audits and penetration testing

---

## Common Issues & Solutions

### Issue: "authToken not found" in localStorage
**Solution**: 
- Check that login was successful (response status 200)
- Verify token is in response body as `data.token`
- Check AuthContext login() function is being called

### Issue: API requests getting 401 Unauthorized
**Solution**:
- Verify token exists: `localStorage.getItem("authToken")`
- Verify Authorization header is in request (DevTools → Network)
- Check token expiration: decode and check `exp` claim
- Verify JWT_SECRET matches between frontend and backend

### Issue: Login successful but redirect not working
**Solution**:
- Check token decoding: `JSON.parse(atob(token.split('.')[1]))`
- Verify role is correctly extracted
- Check navigation function is working (`navigate` from wouter)
- Look for JavaScript errors in console

### Issue: Logout button not appearing
**Solution**:
- Check AuthProvider is wrapping entire app
- Verify useAuth() is imported correctly
- Check isAuthenticated state after login
- Ensure LogoutButton component is imported in Navbar

---

## Environment Variables

### Required Server Variables
```bash
# .env file
JWT_SECRET=your-secret-key-here-use-strong-random-value
NODE_ENV=development
DATABASE_URL=... (if using database)
```

### Optional Customization
```bash
# Token expiration (in routes.ts)
expiresIn: "7d"  # Currently hardcoded, consider making configurable

# JWT algorithm (currently using HS256)
# Can be changed in jwt.sign() call if needed
```

---

## Next Steps

### Short-term (Optional Enhancements)
1. Add "Remember Me" checkbox (longer expiration)
2. Implement password reset flow
3. Add two-factor authentication
4. Implement refresh token endpoint
5. Add login session management (view active sessions)

### Long-term (Production Ready)
1. Migrate to httpOnly cookies
2. Implement refresh token strategy
3. Add comprehensive audit logging
4. Set up security monitoring and alerting
5. Regular penetration testing
6. Implement OWASP security recommendations

---

## Summary

✅ **Completed**:
- JWT token generation on login
- Token storage in localStorage
- Authorization header attachment to all API requests
- Role-based access control
- Logout functionality
- Protected route component
- Global AuthContext for state management
- Comprehensive error handling

🔄 **In Progress**: Testing and validation

📋 **Ready for**: Production deployment with additional security hardening
