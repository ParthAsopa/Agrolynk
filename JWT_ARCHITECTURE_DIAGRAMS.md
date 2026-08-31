# JWT Authentication Architecture & Data Flow Diagrams

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AGROLYNK APPLICATION                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────┐         ┌──────────────────────────┐  │
│  │   FRONTEND (React)       │◄───────►│    BACKEND (Express)     │  │
│  │  ┌────────────────────┐  │         │  ┌────────────────────┐  │  │
│  │  │  Components        │  │         │  │  API Routes        │  │  │
│  │  │  - Login.tsx       │  │         │  │  - /api/auth/*     │  │  │
│  │  │  - Navbar.tsx      │  │         │  │  - /api/protected  │  │  │
│  │  │  - Dashboard       │  │         │  │                    │  │  │
│  │  └────────────────────┘  │         │  └────────────────────┘  │  │
│  │                          │         │                          │  │
│  │  ┌────────────────────┐  │         │  ┌────────────────────┐  │  │
│  │  │  AuthContext       │  │         │  │  Auth Middleware   │  │  │
│  │  │  - token           │  │         │  │  - requireAuth()   │  │  │
│  │  │  - user            │  │         │  │  - requireRole()   │  │  │
│  │  │  - isAuthenticated │  │         │  │                    │  │  │
│  │  └────────────────────┘  │         │  └────────────────────┘  │  │
│  │                          │         │                          │  │
│  │  ┌────────────────────┐  │         │  ┌────────────────────┐  │  │
│  │  │  queryClient       │  │         │  │  Database/Storage  │  │  │
│  │  │  - apiRequest()    │  │         │  │  - users           │  │  │
│  │  │  - getQueryFn()    │  │         │  │  - listings        │  │  │
│  │  │                    │  │         │  │  - offers          │  │  │
│  │  └────────────────────┘  │         │  └────────────────────┘  │  │
│  │                          │         │                          │  │
│  │  ┌────────────────────┐  │         │  ┌────────────────────┐  │  │
│  │  │  localStorage      │  │         │  │  Environment       │  │  │
│  │  │  - authToken       │  │         │  │  - JWT_SECRET      │  │  │
│  │  └────────────────────┘  │         │  └────────────────────┘  │  │
│  │                          │         │                          │  │
│  └──────────────────────────┘         └──────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LOGIN SEQUENCE                                      │
└─────────────────────────────────────────────────────────────────────────┘

USER                    FRONTEND                   BACKEND                
 │                         │                          │                  
 │  1. Enter credentials    │                          │                  
 │────────────────────────►│                          │                  
 │                         │                          │                  
 │                         │  2. POST /api/auth/login │                  
 │                         │     { email, password }  │                  
 │                         │─────────────────────────►│                  
 │                         │                          │                  
 │                         │                          │  3. Validate     
 │                         │                          │     credentials  
 │                         │                          │                  
 │                         │                          │  4. bcrypt.verify
 │                         │                          │     password     
 │                         │                          │                  
 │                         │                          │  5. jwt.sign()   
 │                         │                          │     { userId,    
 │                         │  6. Response             │      role,       
 │                         │     { token }            │      exp: +7d }  
 │                         │◄─────────────────────────│                  
 │                         │                          │                  
 │                         │  7. login(token)         │                  
 │                         │     - localStorage.set   │                  
 │                         │     - Decode payload     │                  
 │                         │     - Store in Context   │                  
 │                         │                          │                  
 │  8. Redirect to         │                          │                  
 │     dashboard ◄─────────│                          │                  
 │                         │                          │                  
 │  9. Authenticated ✓     │                          │                  
 │                         │                          │                  
```

---

## 3. API Request Flow (With Token)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   API REQUEST SEQUENCE                                   │
└─────────────────────────────────────────────────────────────────────────┘

USER                 FRONTEND                    BACKEND                   
 │                      │                           │                     
 │  Click to fetch      │                           │                     
 │────────────────────►│                           │                     
 │                     │  1. apiRequest()           │                     
 │                     │     - Get token from       │                     
 │                     │       localStorage         │                     
 │                     │     - Build headers        │                     
 │                     │     - Add Authorization:   │                     
 │                     │       Bearer <token>       │                     
 │                     │                            │                     
 │                     │  2. fetch()                │                     
 │                     │─────────────────────────►│                     
 │                     │                            │  3. requireAuth      
 │                     │                            │     middleware       
 │                     │                            │     - Extract token  
 │                     │                            │     - jwt.verify()   
 │                     │                            │     - Validate sig   
 │                     │                            │     - Check exp      
 │                     │                            │                     
 │                     │                            │  4. req.user =       
 │                     │                            │     decoded payload  
 │                     │                            │                     
 │                     │                            │  5. Route handler    
 │                     │                            │     (with auth)      
 │                     │                            │                     
 │                     │  6. Response               │                     
 │                     │     (200 OK + data)        │                     
 │                     │◄─────────────────────────│                     
 │                     │                            │                     
 │  7. Display data ◄──│                           │                     
 │                     │                            │                     
```

---

## 4. Token Validation & Storage

```
┌──────────────────────────────────────────────────────────────┐
│              TOKEN STRUCTURE & LIFECYCLE                      │
└──────────────────────────────────────────────────────────────┘

TOKEN GENERATION:
  ┌─────────────────────────────────┐
  │  POST /api/auth/login           │
  │  { email, password }            │
  └────────┬────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │  jwt.sign(                      │
  │    payload: {                   │
  │      userId: 1,                 │
  │      role: "farmer"             │
  │    },                           │
  │    secret: JWT_SECRET,          │
  │    expiresIn: "7d"              │
  │  )                              │
  └────────┬────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │  JWT Token Generated:           │
  │  eyJhbGciOiJIUzI1NiIsInR5c...  │
  │  (Header.Payload.Signature)     │
  └────────┬────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │  Response: { token: "..." }     │
  └─────────────────────────────────┘


TOKEN STORAGE:
  ┌─────────────────────────────────┐
  │  Frontend receives token        │
  └────────┬────────────────────────┘
           │
           ├──► localStorage.setItem(
           │    "authToken", 
           │    "eyJ..."
           │  )
           │
           ├──► AuthContext.login()
           │    - Decode JWT
           │    - Extract userId, role
           │    - Store in React state
           │
           └──► Navigate to dashboard


TOKEN USAGE IN REQUESTS:
  ┌─────────────────────────────────┐
  │  GET /api/protected             │
  │  Headers:                       │
  │  - Authorization: Bearer eyJ... │
  │  - Content-Type: application/..│
  └─────────────────────────────────┘


TOKEN VALIDATION:
  ┌─────────────────────────────────┐
  │  Backend receives request       │
  └────────┬────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │  requireAuth middleware         │
  │  - Extract from header          │
  │  - jwt.verify(token, secret)    │
  │  - Check signature              │
  │  - Check expiration             │
  └────────┬─────────┬──────────────┘
           │         │
        ✅ Valid  ❌ Invalid
           │         │
           ▼         ▼
        Success    401 Unauthorized
        req.user   Response
        set


TOKEN EXPIRATION:
  Issued:     2026-08-31 10:00:00 UTC
  Expires:    2026-09-07 10:00:00 UTC (7 days)
  
  Status:     ✅ Valid     ❌ Expired
             (Before exp) (After exp)
                │           │
                ▼           ▼
            Access         401 + Clear
            Granted        Token from
                          localStorage
```

---

## 5. Role-Based Access Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              ROLE-BASED ACCESS CONTROL                          │
└─────────────────────────────────────────────────────────────────┘

API REQUEST:
  GET /api/farmer/protected
  Authorization: Bearer <farmer_token>
  │
  ▼
requireAuth middleware:
  ┌──────────────────────────────────┐
  │ 1. Extract token from header     │
  │ 2. jwt.verify(token, secret)     │
  │ 3. Set req.user = {userId, role} │
  │    req.user = {                  │
  │      userId: 5,                  │
  │      role: "farmer"              │
  │    }                             │
  └────────┬─────────────────────────┘
           │
        ✅ Valid
           │
           ▼
requireRole(["farmer"]) middleware:
  ┌──────────────────────────────────┐
  │ 1. Check req.user exists         │
  │ 2. Get req.user.role             │
  │    role = "farmer"               │
  │ 3. Is "farmer" in ["farmer"]?    │
  └────────┬──────────┬──────────────┘
           │          │
          YES        NO
           │          │
           ▼          ▼
        ✅ Next    ❌ 403 Forbidden
                    "Access denied.
                     Requires one of
                     the following roles:
                     farmer"


DIFFERENT ROLE SCENARIOS:

Scenario 1: Farmer accessing farmer route
  Route: /api/farmer/protected
  User role: "farmer"
  Required roles: ["farmer"]
  Result: ✅ 200 OK

Scenario 2: Company accessing farmer route
  Route: /api/farmer/protected
  User role: "company"
  Required roles: ["farmer"]
  Result: ❌ 403 Forbidden

Scenario 3: Either role accessing shared route
  Route: /api/market/trading-desk
  User role: "farmer" OR "company"
  Required roles: ["farmer", "company"]
  Result: ✅ 200 OK

Scenario 4: No token trying to access protected route
  Route: /api/protected
  Token: (missing)
  Result: ❌ 401 Unauthorized
          "Authorization header with
           Bearer token is required"
```

---

## 6. Frontend Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   COMPONENT HIERARCHY                            │
└──────────────────────────────────────────────────────────────────┘

App.tsx
│
├─ AuthProvider (Context)
│  │  Global auth state: { token, user, login, logout }
│  │
│  └─ LanguageProvider
│     │
│     └─ QueryClientProvider
│        │
│        └─ MainLayout
│           │
│           └─ Switch (Router)
│              │
│              ├─ Route: /login
│              │  └─ Login.tsx
│              │     Uses: useAuth() - login()
│              │     Stores: JWT in localStorage
│              │     
│              │
│              ├─ Route: /farmer/*
│              │  └─ ProtectedRoute (allowedRoles=["farmer"])
│              │     ├─ FarmerOptions.tsx
│              │     ├─ FarmerDashboard.tsx
│              │     ├─ FarmerBuy.tsx
│              │     └─ FarmerSell.tsx
│              │        All use: useAuth(), apiRequest()
│              │
│              ├─ Route: /company/*
│              │  └─ ProtectedRoute (allowedRoles=["company"])
│              │     ├─ CompanyOptions.tsx
│              │     ├─ CompanyBuy.tsx
│              │     └─ CompanySell.tsx
│              │        All use: useAuth(), apiRequest()
│              │
│              └─ Route: /
│                 └─ Home.tsx
│
└─ Navbar.tsx
   ├─ Uses: useAuth()
   ├─ Shows: LogoutButton if authenticated
   ├─ Shows: Login link if not authenticated
   └─ Imports: LogoutButton component


DATA FLOW WITHIN COMPONENTS:

Component
  │
  ├─ useAuth()
  │  └─ Get: { isAuthenticated, user, token, login, logout }
  │
  ├─ apiRequest()
  │  └─ Automatically includes Authorization header
  │
  ├─ useQuery()
  │  └─ Uses queryClient with getQueryFn()
  │     └─ Includes Authorization header
  │
  └─ useAuthenticatedFetch()
     └─ Hook for manual authenticated requests
```

---

## 7. Token Flow Through Request Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│              COMPLETE REQUEST LIFECYCLE                          │
└──────────────────────────────────────────────────────────────────┘

┌─ BROWSER ─────────────────────────────────────────────────────┐
│                                                                │
│  1. Component renders                                         │
│     useQuery({                                                │
│       queryKey: ["/api/data"]                                 │
│     })                                                         │
│                                                                │
│  2. React Query calls getQueryFn()                            │
│     getQueryFn({ queryKey: ["/api/data"] })                  │
│                                                                │
│  3. getQueryFn() retrieves token                              │
│     const token = localStorage.getItem("authToken")           │
│                                                                │
│  4. Adds Authorization header                                 │
│     headers: { Authorization: `Bearer ${token}` }             │
│                                                                │
│  5. fetch() makes HTTP request                                │
│     GET /api/data                                             │
│     Authorization: Bearer eyJh...                             │
│                                                                │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTP Request
                         ▼
┌─ SERVER ──────────────────────────────────────────────────────┐
│                                                                │
│  6. Express receives request                                  │
│     GET /api/data                                             │
│     Authorization: Bearer eyJh...                             │
│                                                                │
│  7. requireAuth middleware executes                           │
│     const authHeader = req.headers.authorization              │
│     const token = authHeader.substring(7) // Remove "Bearer " │
│                                                                │
│  8. Verify JWT                                                │
│     jwt.verify(token, JWT_SECRET)                             │
│     ├─ Check signature                                        │
│     ├─ Check expiration                                       │
│     └─ Decode payload                                         │
│                                                                │
│  9. Token is valid ✓                                          │
│     req.user = { userId: 1, role: "farmer" }                 │
│                                                                │
│  10. Next middleware / route handler                          │
│      app.get("/api/data", (req, res) => {                    │
│        console.log(req.user) // Access user data             │
│        res.json({ ... })                                      │
│      })                                                        │
│                                                                │
│  11. Response sent                                            │
│      200 OK                                                    │
│      { data: [...] }                                          │
│                                                                │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTP Response
                         ▼
┌─ BROWSER ─────────────────────────────────────────────────────┐
│                                                                │
│  12. Response received                                        │
│      Status: 200                                              │
│      Body: { data: [...] }                                    │
│                                                                │
│  13. queryFn returns data                                     │
│      return await res.json()                                  │
│                                                                │
│  14. React Query caches data                                  │
│      queryClient stores result                                │
│                                                                │
│  15. Component updates                                        │
│      Component re-renders with data                           │
│                                                                │
│  16. UI displays data                                         │
│      User sees: [...data items...]                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                ERROR HANDLING SCENARIOS                         │
└─────────────────────────────────────────────────────────────────┘

SCENARIO 1: No Token Sent
  ┌────────────────────────────────────────┐
  │ GET /api/protected                     │
  │ (No Authorization header)              │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ requireAuth middleware                 │
  │ authHeader = undefined                 │
  │ ❌ Token missing                       │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ Response: 401 Unauthorized             │
  │ {                                      │
  │   "error": "Authorization header       │
  │             with Bearer token is       │
  │             required"                  │
  │ }                                      │
  └────────────────────────────────────────┘


SCENARIO 2: Invalid/Tampered Token
  ┌────────────────────────────────────────┐
  │ GET /api/protected                     │
  │ Authorization: Bearer INVALID.TOKEN    │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ requireAuth middleware                 │
  │ jwt.verify(token, JWT_SECRET)          │
  │ ❌ Verification failed                │
  │ (signature doesn't match)              │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ Response: 401 Unauthorized             │
  │ {                                      │
  │   "error": "Invalid or expired token"  │
  │ }                                      │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ Frontend (apiRequest):                 │
  │ if (res.status === 401) {              │
  │   localStorage.removeItem("authToken") │
  │ }                                      │
  │ Token cleared from storage             │
  └────────────────────────────────────────┘


SCENARIO 3: Expired Token
  ┌────────────────────────────────────────┐
  │ Token generated: 2026-08-31 10:00 UTC  │
  │ Expiration: 2026-09-07 10:00 UTC       │
  │ Current time: 2026-09-15 10:00 UTC     │
  │ Status: ❌ EXPIRED (8 days old)        │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ GET /api/protected                     │
  │ Authorization: Bearer <expired_token>  │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ requireAuth middleware                 │
  │ jwt.verify(token, JWT_SECRET)          │
  │ ❌ Token expired                       │
  │ (exp < now)                            │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ Response: 401 Unauthorized             │
  │ {                                      │
  │   "error": "Invalid or expired token"  │
  │ }                                      │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ Frontend clears token                  │
  │ User redirected to login               │
  │ User must re-login to get new token    │
  └────────────────────────────────────────┘


SCENARIO 4: Insufficient Permissions
  ┌────────────────────────────────────────┐
  │ GET /api/farmer/protected              │
  │ Authorization: Bearer <company_token>  │
  │ req.user = { userId: 2, role: "co..." │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ requireAuth: ✅ Token valid            │
  │ req.user populated                     │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ requireRole(["farmer"]):               │
  │ "company" in ["farmer"]? ❌ NO         │
  └────────────┬─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────┐
  │ Response: 403 Forbidden                │
  │ {                                      │
  │   "error": "Access denied. Requires    │
  │             one of the following       │
  │             roles: farmer"             │
  │ }                                      │
  └────────────────────────────────────────┘
```

---

## 9. State Management Flow

```
┌──────────────────────────────────────────────────────────────────┐
│               AUTHCONTEXT STATE MANAGEMENT                       │
└──────────────────────────────────────────────────────────────────┘

INITIAL STATE (Component Mount):
┌─────────────────────────────────────────────┐
│ AuthContext initial state:                  │
│ {                                           │
│   token: null,                              │
│   isAuthenticated: false,                   │
│   user: null,                               │
│   isLoading: true                           │
│ }                                           │
│                                             │
│ useEffect checks localStorage               │
│ const storedToken = localStorage.getItem()  │
└────────┬────────────────────────────────────┘
         │
         ├─ Token found
         │  └─ Decode and validate
         │     ├─ Not expired: set token + user
         │     └─ Expired: clear localStorage
         │
         └─ No token found
            └─ Remain logged out
         
         isLoading: true ──► isLoading: false


LOGIN (User calls login(token)):
┌─────────────────────────────────────────────┐
│ login(token)                                │
│ 1. localStorage.setItem("authToken", token) │
│ 2. Decode token: atob(token.split('.')[1]) │
│ 3. Extract: userId, role, iat, exp         │
│ 4. setState({ token, user })               │
│ 5. isAuthenticated = true                  │
└─────────────────────────────────────────────┘

STATE AFTER LOGIN:
┌─────────────────────────────────────────────┐
│ AuthContext state:                          │
│ {                                           │
│   token: "eyJhbGciOi...",                  │
│   isAuthenticated: true,                    │
│   user: {                                   │
│     userId: 1,                              │
│     role: "farmer",                         │
│     iat: 1693469234,                        │
│     exp: 1694074034                         │
│   },                                        │
│   isLoading: false                          │
│ }                                           │
└─────────────────────────────────────────────┘


LOGOUT (User calls logout()):
┌─────────────────────────────────────────────┐
│ logout()                                    │
│ 1. localStorage.removeItem("authToken")     │
│ 2. setState({                               │
│      token: null,                           │
│      user: null,                            │
│      isAuthenticated: false                 │
│    })                                       │
└─────────────────────────────────────────────┘

STATE AFTER LOGOUT:
┌─────────────────────────────────────────────┐
│ AuthContext state:                          │
│ {                                           │
│   token: null,                              │
│   isAuthenticated: false,                   │
│   user: null,                               │
│   isLoading: false                          │
│ }                                           │
└─────────────────────────────────────────────┘


COMPONENT UPDATES:
┌─────────────────────────────────────────────┐
│ Any component using useAuth():              │
│                                             │
│ function MyComponent() {                    │
│   const { isAuthenticated } = useAuth()     │
│   return isAuthenticated ? <P1/> : <P2/>   │
│ }                                           │
│                                             │
│ When AuthContext updates:                   │
│  1. useAuth() subscribers are notified      │
│  2. Components re-render                    │
│  3. Conditional logic executes              │
│  4. UI updates                              │
└─────────────────────────────────────────────┘
```

---

## 10. Data Flow Summary Table

```
┌──────────────────────────────────────────────────────────────────┐
│           QUICK REFERENCE: WHO DOES WHAT                         │
└──────────────────────────────────────────────────────────────────┘

COMPONENT               RESPONSIBILITY
────────────────────────────────────────────────────────────────
Login.tsx              1. Accept email/password
                       2. Send to /api/auth/login
                       3. Receive token
                       4. Call login(token)
                       5. Redirect to dashboard

AuthContext.tsx        1. Store token in localStorage
                       2. Decode JWT payload
                       3. Manage auth state
                       4. Provide useAuth() hook
                       5. Handle persistence on mount

queryClient.ts         1. Get token from localStorage
                       2. Add Authorization header
                       3. Make fetch request
                       4. Handle 401 response
                       5. Return response

Navbar.tsx             1. Check if authenticated
                       2. Show logout if authenticated
                       3. Show login if not authenticated
                       4. Handle logout click

ProtectedRoute.tsx     1. Check authentication
                       2. Check user role
                       3. Show loading state
                       4. Redirect or deny access

LogoutButton.tsx       1. Show user role
                       2. Call logout on click
                       3. Redirect to login

Backend Routes         1. Receive request with token
                       2. requireAuth validates token
                       3. requireRole checks permission
                       4. Route handler executes
                       5. Return response


DATA MOVEMENT
────────────────────────────────────────────────────────────────
Component              ──►  localStorage
  │                         │
  ├─ AuthContext            ├─ Token persists
  │                         │
  ├─ useAuth hook           ├─ Survives page reload
  │                         │
  └─ State updates          └─ Shared across tabs


localStorage           ──►  queryClient
  │                         │
  ├─ Get token               ├─ Add to header
  │                         │
  └─ For each request       └─ Send to server


queryClient            ──►  Backend API
  │                         │
  ├─ Authorization header   ├─ Receive header
  │                         │
  └─ Every request          ├─ Validate JWT
                            │
                            └─ Authenticate request


Backend API            ──►  Frontend
  │                         │
  ├─ 200 + data             ├─ Show data
  │                         │
  ├─ 401 Unauthorized       ├─ Clear token
  │                         │
  ├─ 403 Forbidden          ├─ Show error
  │                         │
  └─ 500 Error             └─ Show error message
```

---

## 11. Key Interaction Points

```
┌──────────────────────────────────────────────────────────────────┐
│           CRITICAL AUTHENTICATION CHECKPOINTS                    │
└──────────────────────────────────────────────────────────────────┘

CHECKPOINT 1: Login Submission
  ┌─────────────────────────────────────────┐
  │ POST /api/auth/login                    │
  │ MUST send: email, password              │
  │ MUST NOT send: username                 │
  └─────────────────────────────────────────┘

CHECKPOINT 2: Response Processing
  ┌─────────────────────────────────────────┐
  │ Response: { token: "..." }              │
  │ MUST extract: data.token                │
  │ MUST validate: response.ok === true     │
  │ MUST store: login(data.token)           │
  └─────────────────────────────────────────┘

CHECKPOINT 3: API Request Header
  ┌─────────────────────────────────────────┐
  │ Headers: {                              │
  │   Authorization: "Bearer " + token      │
  │ }                                       │
  │ MUST have: "Bearer " prefix             │
  │ MUST have: token from localStorage      │
  │ MUST be: "Authorization" (exact case)   │
  └─────────────────────────────────────────┘

CHECKPOINT 4: Server Token Validation
  ┌─────────────────────────────────────────┐
  │ jwt.verify(token, JWT_SECRET)           │
  │ MUST match: JWT_SECRET env variable     │
  │ MUST check: signature validity          │
  │ MUST check: expiration time             │
  │ MUST extract: userId, role payload      │
  └─────────────────────────────────────────┘

CHECKPOINT 5: Role Authorization
  ┌─────────────────────────────────────────┐
  │ requireRole(["farmer"])                 │
  │ MUST check: user.role is in list        │
  │ MUST return: 403 if not allowed         │
  │ MUST return: 200 if allowed             │
  └─────────────────────────────────────────┘

CHECKPOINT 6: Error Handling
  ┌─────────────────────────────────────────┐
  │ On 401 response:                        │
  │ MUST clear: localStorage token          │
  │ MUST clear: AuthContext state           │
  │ MUST redirect: to /login page           │
  │ MUST NOT: retry indefinitely            │
  └─────────────────────────────────────────┘
```

---

**Document Status**: Complete and Ready for Reference  
**Last Updated**: August 31, 2026  
**Use**: For understanding system architecture and debugging authentication issues
