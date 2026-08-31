# JWT Authentication - Quick Reference Guide

## Most Common Tasks

### 1. Check if User is Logged In
```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <p>Logged in!</p> : <p>Not logged in</p>;
}
```

### 2. Get Current User Info
```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user } = useAuth(); // Returns { userId, role, iat, exp }
  console.log("User ID:", user?.userId);
  console.log("User Role:", user?.role); // "farmer" or "company"
}
```

### 3. Make an Authenticated API Request
```typescript
import { apiRequest } from "@/lib/queryClient";

// This automatically includes the Authorization header
const response = await apiRequest("POST", "/api/listings", {
  crop: "wheat",
  quantity: 100
});
const data = await response.json();
```

### 4. Check if User is Admin/Farmer/Company
```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user } = useAuth();
  
  if (user?.role === "farmer") {
    return <FarmerDashboard />;
  } else if (user?.role === "company") {
    return <CompanyDashboard />;
  }
  return <LoadingSpinner />;
}
```

### 5. Protect a Route
```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

<ProtectedRoute allowedRoles={["farmer"]}>
  <FarmerOnlyPage />
</ProtectedRoute>
```

### 6. Logout User
```typescript
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

function LogoutBtn() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    logout(); // Clears token + state
    navigate("/login"); // Redirect to login
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

### 7. Handle Errors on Protected Route
```typescript
async function handleApiCall() {
  try {
    const response = await apiRequest("GET", "/api/protected");
    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid/expired, already handled by apiRequest()
        console.log("Session expired, please login again");
      } else if (response.status === 403) {
        console.log("You don't have permission to access this");
      }
      return;
    }
    const data = await response.json();
  } catch (error) {
    console.error("Request failed:", error);
  }
}
```

---

## Token Details

### Token Structure
```
Header.Payload.Signature

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOjEsInJvbGUiOiJmYXJtZXIiLCJpYXQiOjE2OTQwMDAwMDAsImV4cCI6MTY5NDA2MDAwMDB9.
abc123...
```

### Token Payload (Decoded)
```json
{
  "userId": 1,
  "role": "farmer",
  "iat": 1694000000,
  "exp": 1694600000
}
```

### Decode Token in Browser
```javascript
const token = localStorage.getItem("authToken");
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
// Output: { userId: 1, role: "farmer", iat: ..., exp: ... }

// Check expiration
const expiresAt = new Date(payload.exp * 1000);
console.log("Expires at:", expiresAt);
```

---

## Storage Location

### Where is the Token Stored?
```javascript
// In browser localStorage
localStorage.getItem("authToken") // Returns: "eyJhbGciOi..."

// Remove token (logout)
localStorage.removeItem("authToken")

// Check if token exists
if (localStorage.getItem("authToken")) {
  console.log("User is logged in");
}
```

### Never Store These
- ❌ In URL query parameters
- ❌ In plain text files
- ❌ In comments
- ❌ In version control

### Where AuthContext Stores
- In localStorage for persistence
- In React state for current session
- Automatically synced between both

---

## API Request Format

### Request with Token
```
GET /api/protected HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
{
  "data": "..."
}
```

### Request without Token (Fails)
```
GET /api/protected HTTP/1.1
Host: localhost:5000

Response (401):
{
  "error": "Authorization header with Bearer token is required"
}
```

### Format is Important
```
✅ Correct:   Authorization: Bearer eyJhbGciOi...
❌ Wrong:     Authorization: eyJhbGciOi...
❌ Wrong:     Authorization: JWT eyJhbGciOi...
❌ Wrong:     Token eyJhbGciOi...
```

---

## Error Handling

### 401 Unauthorized
```typescript
// Token is missing, invalid, or expired
// Already handled by apiRequest() - clears token and redirects
// You'll see error: "Invalid or expired token"
```

### 403 Forbidden
```typescript
// User doesn't have required role
// Example: Farmer trying to access company-only route
// You'll see error: "Access denied. Requires one of the following roles: company"
```

### Network Error
```typescript
try {
  const response = await apiRequest("GET", "/api/data");
  const data = await response.json();
} catch (error) {
  // Network error, server down, etc.
  console.error("Request failed:", error);
}
```

---

## Hooks & Functions Reference

### useAuth() Hook
```typescript
import { useAuth } from "@/context/AuthContext";

const {
  token,                    // JWT string or null
  isAuthenticated,          // boolean
  user,                     // { userId, role, iat, exp } or null
  login,                    // (token: string) => void
  logout,                   // () => void
  isLoading                 // boolean (checking localStorage on mount)
} = useAuth();
```

### apiRequest() Function
```typescript
import { apiRequest } from "@/lib/queryClient";

// GET request
const response = await apiRequest("GET", "/api/data");

// POST request
const response = await apiRequest("POST", "/api/data", { key: "value" });

// PATCH request
const response = await apiRequest("PATCH", "/api/data/1", { key: "updated" });

// DELETE request (doesn't use apiRequest, use authenticatedDelete)
```

### useAuthenticatedFetch() Hook
```typescript
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

const { authenticatedFetch } = useAuthenticatedFetch();

const response = await authenticatedFetch("/api/data", {
  method: "POST",
  body: JSON.stringify({ data: "value" })
});
```

---

## Login/Signup Flow

### Login
```typescript
// 1. User enters email and password
// 2. Frontend sends to /api/auth/login
// 3. Backend validates and returns { token: "..." }
// 4. Frontend stores token with login() function
// 5. Frontend navigates to dashboard

const handleLogin = async (email, password) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    login(data.token); // Store token
    navigate("/farmer/options"); // Navigate to appropriate page
  }
};
```

### Signup/Register
```typescript
// Similar flow but to /api/auth/register
// Endpoint accepts: name, email, password, role (farmer or company)

const handleRegister = async (name, email, password, role) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    login(data.token); // Auto-login after signup
    navigate(role === "farmer" ? "/farmer/options" : "/company/options");
  }
};
```

---

## Common Patterns

### Conditional Rendering Based on Auth
```typescript
function Dashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  if (user?.role !== "farmer") return <AccessDenied />;
  
  return <FarmerDashboard />;
}
```

### Fetching Data in useEffect
```typescript
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (!isAuthenticated) return; // Don't fetch if not logged in
    
    const fetchData = async () => {
      const response = await apiRequest("GET", "/api/data");
      const json = await response.json();
      setData(json);
    };
    
    fetchData();
  }, [isAuthenticated]);
  
  return <div>{/* render data */}</div>;
}
```

### Using React Query with Auth
```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ["/api/data"],
    enabled: isAuthenticated, // Only run if authenticated
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/data");
      return response.json();
    }
  });
  
  return <div>{/* render data */}</div>;
}
```

---

## Debugging Tips

### Check Token in Console
```javascript
// See token
console.log("Token:", localStorage.getItem("authToken"));

// Decode and inspect
const token = localStorage.getItem("authToken");
const payload = JSON.parse(atob(token.split('.')[1]));
console.log("Payload:", payload);

// Check if expired
const now = Math.floor(Date.now() / 1000);
console.log("Expired?", payload.exp < now);
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Make any API request
3. Click on request → Headers tab
4. Look for `Authorization: Bearer ...`
5. Should see the token in every request

### Check Auth State in Component
```typescript
import { useAuth } from "@/context/AuthContext";

function DebugComponent() {
  const auth = useAuth();
  
  return (
    <pre>
      {JSON.stringify({
        isAuthenticated: auth.isAuthenticated,
        userId: auth.user?.userId,
        role: auth.user?.role,
        hasToken: !!auth.token,
        isLoading: auth.isLoading
      }, null, 2)}
    </pre>
  );
}
```

---

## Common Mistakes to Avoid

### ❌ Don't Do This

```typescript
// Wrong: Hardcoding endpoint without /auth path
fetch("/api/login", { /* ... */ })

// Wrong: Sending username instead of email
body: JSON.stringify({ username: email, password })

// Wrong: Not storing token after login
const data = await response.json(); // Token not saved!

// Wrong: Using credentials instead of Authorization header
fetch("/api/data", { credentials: "include" })

// Wrong: Making API calls before checking authentication
useEffect(() => {
  fetchData(); // Might fail with 401 if not authenticated yet
}, []);

// Wrong: Storing sensitive data in state without clearing
const [password, setPassword] = useState(userPassword);
```

### ✅ Do This

```typescript
// Correct: Use /auth/login endpoint
fetch("/api/auth/login", { /* ... */ })

// Correct: Send email field
body: JSON.stringify({ email, password })

// Correct: Store token using login()
const data = await response.json();
if (data.token) login(data.token);

// Correct: Use Authorization header
fetch("/api/data", {
  headers: { "Authorization": `Bearer ${token}` }
})

// Correct: Check authentication before fetching
useEffect(() => {
  if (!isAuthenticated) return;
  fetchData();
}, [isAuthenticated]);

// Correct: Clear password from state immediately
setPassword(""); // After successful submit
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 on every request | Token is missing or expired. Check localStorage. |
| 403 Access Denied | Wrong role. Verify user role matches route requirement. |
| Token not persisting | Token not stored via login(). Check Login.tsx code. |
| Login page not redirecting | Role not being extracted correctly. Check token decode. |
| API missing auth header | apiRequest() not being used. Verify import and usage. |
| Logout not working | logout() not being called or state not updating. |
| Multiple auth providers | Only one AuthProvider should wrap the app. |

---

## Quick Setup Checklist

- [ ] App.tsx has `<AuthProvider>` wrapper
- [ ] Login.tsx uses `/api/auth/login` endpoint
- [ ] Login.tsx extracts and stores token with `login()`
- [ ] queryClient.ts includes Authorization header in requests
- [ ] Components use `useAuth()` for checking authentication
- [ ] Protected routes use `<ProtectedRoute>` component
- [ ] Navbar includes `<LogoutButton>` for authenticated users
- [ ] No hardcoded tokens in code
- [ ] JWT_SECRET is in environment variables

---

## Need Help?

### Check These Files
- `client/src/context/AuthContext.tsx` - Auth state logic
- `client/src/lib/queryClient.ts` - API request logic
- `client/src/pages/Login.tsx` - Login implementation
- `server/middleware/auth.ts` - Backend validation

### Relevant Documentation
- [JWT.io](https://jwt.io/) - JWT specification
- [React Context API Docs](https://react.dev/reference/react/useContext)
- [Fetch API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## Performance Note

The token is decoded on component mount and stored in context, so `useAuth()` calls are O(1) and don't trigger re-fetches. The Authorization header is added to each request by reading from localStorage, which is very fast.

---

**Last Updated**: August 31, 2026  
**Status**: ✅ Production Ready (with recommended security enhancements for production)
