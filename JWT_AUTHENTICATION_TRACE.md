# JWT Authentication Flow Analysis - AgroLynk

## 1. Overall Flow Diagram

```
Client Login Request
       ↓
[Frontend] Login.tsx sends email + password
       ↓
POST /api/auth/login (server/routes.ts)
       ↓
[Backend] Validate credentials with bcrypt
       ↓
Generate JWT: jwt.sign({ userId, role }, jwtSecret, { expiresIn: "7d" })
       ↓
Return: { token: "eyJhbGciOiJIUzI1NiIs..." }
       ↓
[Frontend] Capture token → Store in localStorage
       ↓
Subsequent API Requests
       ↓
Include Authorization: Bearer <token> header
       ↓
[Backend] requireAuth middleware
       ↓
Extract token from Authorization header
       ↓
Verify JWT signature and expiration
       ↓
Attach decoded { userId, role } to req.user
       ↓
Route handler executes with authenticated context
```

---

## 2. Server-Side Implementation (✅ CORRECT)

### Login Endpoint

**File**: [server/routes.ts](server/routes.ts#L168-L193)

```typescript
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid login credentials" });
  }

  const email = result.data.email.toLowerCase();
  const password = result.data.password;
  const jwtSecret = process.env.JWT_SECRET || "agrolynk_dev_secret_jwt_key";

  try {
    // Fetch user from DB or in-memory storage
    let user = await db.select(...).where(eq(users.email, email));

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
      expiresIn: "7d"
    });

    return res.status(200).json({ token });
  }
});
```

**Key Details**:

- ✅ Expects `email` (not username)
- ✅ Validates password with bcrypt
- ✅ Uses environment variable JWT_SECRET (fallback: "agrolynk_dev_secret_jwt_key")
- ✅ Token expires in 7 days
- ✅ Returns only the `token` string

### Auth Middleware

**File**: [server/middleware/auth.ts](server/middleware/auth.ts)

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Expects: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authorization header with Bearer token is required" });
  }

  const token = authHeader.substring(7).trim(); // Remove "Bearer " prefix

  const jwtSecret = process.env.JWT_SECRET || "agrolynk_dev_secret_jwt_key";

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

**Key Details**:

- ✅ Extracts token from `Authorization: Bearer <token>` header
- ✅ Verifies signature with JWT_SECRET
- ✅ Checks token expiration
- ✅ Returns 401 on invalid/expired token
- ✅ Attaches `{ userId, role }` to `req.user`

### Protected Routes

**File**: [server/routes.ts](server/routes.ts#L564-L572)

```typescript
app.get("/api/user/me", requireAuth, (req, res) => {
  return res
    .status(200)
    .json({ message: "Authenticated successfully", user: req.user });
});

app.get(
  "/api/farmer/protected-summary",
  requireAuth,
  requireRole(["farmer"]),
  (req, res) => {
    return res.status(200).json({ message: "Welcome Farmer!", user: req.user });
  },
);

app.get(
  "/api/market/trading-desk",
  requireAuth,
  requireRole(["farmer", "company"]),
  (req, res) => {
    return res.status(200).json({ message: "Access granted", user: req.user });
  },
);
```

**Key Details**:

- ✅ Routes require `requireAuth` middleware
- ✅ Some routes additionally require specific roles via `requireRole`
- ✅ Token must be valid and non-expired to pass middleware

---

## 3. Frontend Implementation (❌ MULTIPLE CRITICAL ISSUES)

### Issue 1: Wrong Endpoint URL

**File**: [client/src/pages/Login.tsx](client/src/pages/Login.tsx#L23)

```typescript
// ❌ WRONG: Calls /api/login
const response = await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: username.trim(), // ❌ WRONG FIELD NAME
    password,
  }),
});

// Expected by backend: /api/auth/login with { email, password }
```

**Issues**:

- ❌ Endpoint: `/api/login` should be `/api/auth/login`
- ❌ Field: `username` should be `email`

**Expected Server Response**:

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Actual Frontend Code**:

```typescript
const data = await response.json();

if (!response.ok) {
  setError(data.error || "Invalid username or password.");
  return;
}

// ❌ WRONG: Backend returns { token }, not { user.role }
if (data.user.role === "farmer") {
  navigate("/farmer/options");
  return;
}
```

---

### Issue 2: Token Not Stored

**File**: [client/src/pages/Login.tsx](client/src/pages/Login.tsx#L23-L52)

After successful login, the token is **never extracted or stored**.

```typescript
// ✅ SHOULD BE:
if (data.token) {
  // Store token in localStorage (or sessionStorage for less persistence)
  localStorage.setItem("authToken", data.token);

  // Decode token to get role (or store role separately)
  // Then navigate to appropriate dashboard
}
```

---

### Issue 3: API Requests Don't Include Auth Header

**File**: [client/src/lib/queryClient.ts](client/src/lib/queryClient.ts#L10-L20)

The `apiRequest` function does **not** add `Authorization` header:

```typescript
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {}, // ❌ NO Auth header!
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // ❌ This is for cookies, not JWT tokens
  });

  await throwIfResNotOk(res);
  return res;
}
```

**Issues**:

- ❌ Missing `Authorization: Bearer <token>` header
- ❌ Using `credentials: "include"` (for cookies) instead of JWT
- ❌ No token retrieval from localStorage

**✅ Should Be**:

```typescript
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const token = localStorage.getItem("authToken");

  const headers: HeadersInit = {
    ...(data && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}
```

---

### Issue 4: Query Function Also Missing Auth Header

**File**: [client/src/lib/queryClient.ts](client/src/lib/queryClient.ts#L26-L42)

The `getQueryFn` function used for React Query also lacks token:

```typescript
export const getQueryFn =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // ❌ For cookies, not JWT
      // ❌ Missing Authorization header
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
```

---

## 4. Authentication Flow Trace

### Scenario: User Logs In and Accesses Protected Route

#### Step 1: Frontend Login Request

```
POST /api/auth/login
Headers: { "Content-Type": "application/json" }
Body: {
  "email": "farmer@example.com",
  "password": "securepass123"
}
```

#### Step 2: Server Validates & Returns Token

```
Backend receives request
  ↓
loginSchema.safeParse validates email + password
  ↓
Query database for user by email
  ↓
bcrypt.compare(password, hashedPassword) → true
  ↓
jwt.sign({ userId: 5, role: "farmer" }, jwtSecret, { expiresIn: "7d" })
  ↓
Token created: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInJvbGUiOiJmYXJtZXIiLCJpYXQiOjE2OTQwMDAwMDAsImV4cCI6MTY5NDA2MDAwMDB9.abc123..."
  ↓
Response Status: 200
Response Body: {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 3: Frontend Receives Token & Stores It (CURRENTLY BROKEN ❌)

```
✅ Should:
  1. Extract token from response.json()
  2. Store in localStorage.setItem("authToken", token)
  3. Parse JWT to extract userId and role (optional, for better UX)
  4. Navigate to appropriate page (/farmer/dashboard or /company/options)

❌ Currently:
  1. Token is lost
  2. Page navigation tries to access data.user.role (undefined)
  3. No token available for future API calls
```

#### Step 4: Frontend Makes Protected API Request (CURRENTLY BROKEN ❌)

```
// User navigates to /api/listings/mine?farmerId=1

❌ Current Request:
GET /api/listings/mine?farmerId=1
Headers: {
  credentials: "include"  ← For cookies, not helpful here
}
No Authorization header!

✅ Should Be:
GET /api/listings/mine?farmerId=1
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 5: Server Validates Token & Processes Request

```
Server receives request
  ↓
requireAuth middleware executes
  ↓
authHeader = req.headers.authorization
  ↓
Extract token from "Bearer <token>"
  ↓
jwt.verify(token, jwtSecret) → { userId: 5, role: "farmer", ... }
  ↓
Attach to req.user = { userId: 5, role: "farmer" }
  ↓
Call next() → Route handler executes with authenticated context
  ↓
Route handler accesses req.user to verify permissions
  ↓
Return protected data
```

---

## 5. Token Storage Options

### Option A: localStorage (Persistent)

```typescript
// Login: Store token
localStorage.setItem("authToken", token);

// API Request: Retrieve token
const token = localStorage.getItem("authToken");

// Logout: Remove token
localStorage.removeItem("authToken");

// Pros: Persists across browser restarts
// Cons: XSS vulnerability if site is compromised
```

### Option B: sessionStorage (Session-based)

```typescript
sessionStorage.setItem("authToken", token);

// Pros: Cleared when tab closes, slightly more secure
// Cons: Lost on page refresh
```

### Option C: Memory + Secure Cookie (Most Secure)

```typescript
// Store in memory (lost on refresh)
let authToken: string | null = null;

// Use httpOnly cookie (backend-managed)
// Frontend never has direct access to token

// Pros: Best security against XSS
// Cons: Requires backend to set httpOnly cookie
```

**Recommendation for AgroLynk**: Use `localStorage` for now with plan to migrate to httpOnly cookies in production.

---

## 6. Summary of Required Fixes

### Frontend Fixes

#### 1. Update Login.tsx

- [ ] Change endpoint from `/api/login` to `/api/auth/login`
- [ ] Change field from `username` to `email`
- [ ] Extract token from response: `data.token`
- [ ] Store token: `localStorage.setItem("authToken", data.token)`
- [ ] Decode token to get role (use `jwt-decode` library)
- [ ] Navigate based on role

#### 2. Update queryClient.ts - apiRequest()

- [ ] Retrieve token from localStorage
- [ ] Add `Authorization: Bearer <token>` header
- [ ] Remove `credentials: "include"`

#### 3. Update queryClient.ts - getQueryFn()

- [ ] Retrieve token from localStorage
- [ ] Add `Authorization: Bearer <token>` header
- [ ] Remove `credentials: "include"`
- [ ] Handle 401 responses by clearing token and redirecting to login

#### 4. Create AuthContext (Optional but Recommended)

- [ ] Manage auth state globally
- [ ] Provide useAuth hook to components
- [ ] Handle token refresh on expiration
- [ ] Centralize logout logic

#### 5. Add jwt-decode dependency

```bash
npm install jwt-decode
```

### Backend Verification (Already Correct ✅)

The server-side implementation is correct:

- ✅ JWT generation with proper expiration
- ✅ Token verification with signature check
- ✅ Bearer token extraction from Authorization header
- ✅ Role-based access control
- ✅ Proper error handling for expired/invalid tokens

---

## 7. Testing Checklist

### Manual API Testing with cURL

```bash
# 1. Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"password123"}'

# Response: {"token":"eyJhbGciOiJIUzI1NiIs..."}

# 2. Use token to access protected route
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Should return: {"message":"Authenticated successfully","user":{"userId":1,"role":"farmer"}}

# 3. Test without token (should fail with 401)
curl -X GET http://localhost:5000/api/user/me

# Should return: {"error":"Authorization header with Bearer token is required"}
```

### Frontend Testing

- [ ] User can login with email and password
- [ ] Token is stored in localStorage after login
- [ ] Token is included in subsequent API requests
- [ ] Protected routes display data correctly
- [ ] Invalid token returns 401 and redirects to login
- [ ] Expired token (after 7 days) redirects to login
- [ ] Logout clears token from localStorage
- [ ] Farmer role navigates to /farmer/options
- [ ] Company role navigates to /company/options

---

## 8. Security Considerations

### Token Security

- ✅ Uses HS256 (HMAC-SHA256) algorithm
- ✅ Token expires in 7 days (reasonable for this app)
- ❌ JWT_SECRET hardcoded as fallback (should always use env variable)
- ⚠️ Should implement token refresh mechanism for long sessions

### Transport Security

- ✅ Authorization header (correct for JWT)
- ✅ Requires HTTPS in production
- ✅ CORS enabled (configure for production)
- ✅ Rate limiting on `/api` routes

### Storage Security

- ⚠️ localStorage is vulnerable to XSS
- 🔒 Best practice: use httpOnly cookies (requires backend changes)

### Recommendations

1. Always use HTTPS in production
2. Implement Content Security Policy (CSP) headers
3. Use httpOnly cookies for token storage if possible
4. Implement token refresh endpoint (token expiration without logout)
5. Add rate limiting on login endpoint to prevent brute force
6. Log authentication events for security monitoring

---

## 9. Next Steps

### Immediate (Critical)

1. Fix Login.tsx endpoint and field name
2. Store token in localStorage after login
3. Update apiRequest() to include Authorization header
4. Update getQueryFn() to include Authorization header
5. Test end-to-end flow

### Short-term (Recommended)

1. Add jwt-decode for decoding token client-side
2. Create AuthContext for global auth state
3. Add logout functionality that clears token
4. Implement 401 error handling with redirect to login
5. Add token persistence check on app load

### Long-term (Production)

1. Migrate to httpOnly cookie storage
2. Implement refresh token endpoint (separate from access token)
3. Add token rotation on sensitive operations
4. Implement OWASP security recommendations
5. Add comprehensive audit logging for all auth events
