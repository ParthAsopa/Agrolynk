# Complete End-to-End Authentication Test Scenarios

## Pre-Test Setup

### 1. Verify Server is Running
```bash
# In one terminal, start the server
npm run dev
# Should see: Server listening on http://localhost:5000
```

### 2. Verify Frontend is Running
```bash
# In another terminal, start the frontend
npm run dev
# Should see: Local: http://localhost:5173
```

### 3. Create Test User (if needed)
```bash
# Using cURL to register a test farmer account
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "email": "farmer@example.com",
    "password": "password123",
    "role": "farmer"
  }'

# Expected Response (Status 201):
# {"token":"eyJhbGciOiJIUzI1NiIs..."}

# Or register a company account
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "email": "company@example.com",
    "password": "password123",
    "role": "company"
  }'
```

---

## Test Scenario 1: Complete Farmer Login and Data Access

### Objective
Verify that a farmer can login, token is stored, and they can access farmer-specific data with Authorization header.

### Steps

#### Step 1.1: Open Browser Console
1. Open `http://localhost:5173/login`
2. Press `F12` to open DevTools
3. Go to "Console" tab
4. Keep console open throughout test

#### Step 1.2: Verify Empty Auth State
```javascript
// In console
console.log("Token before login:", localStorage.getItem("authToken"));
// Expected: null

console.log("Auth context state:", useAuth());
// Will show: { token: null, isAuthenticated: false, user: null, isLoading: false }
```

#### Step 1.3: Perform Login
1. Enter Email: `farmer@example.com`
2. Enter Password: `password123`
3. Click "Login" button

#### Step 1.4: Verify Token is Stored
```javascript
// In console (immediately after login)
const token = localStorage.getItem("authToken");
console.log("Token after login:", token);
// Expected: Long JWT string starting with "eyJ"

// Decode and inspect
const payload = JSON.parse(atob(token.split('.')[1]));
console.log("User ID:", payload.userId);
console.log("Role:", payload.role);
console.log("Expires:", new Date(payload.exp * 1000));
// Expected: userId > 0, role: "farmer", future expiration date
```

#### Step 1.5: Verify Redirect
- ✅ Should redirect to `/farmer/options`
- ✅ URL should show: `http://localhost:5173/farmer/options`

#### Step 1.6: Check Network Requests
1. Go to "Network" tab in DevTools
2. Click any link or trigger an API call
3. Find a request starting with `/api`
4. Click on it and go to "Headers"

**Expected Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### Step 1.7: Access Protected Route
1. Navigate to `/farmer/dashboard`
2. Should display farmer listings and offers
3. Check console for any errors

#### Step 1.8: Verify Navbar Shows Logout
1. Look at top navbar
2. Should show:
   - `Farmer` (role display)
   - `Logout` button
   - NOT the "Login" button

#### Step 1.9: Test Logout
1. Click "Logout" button in navbar
2. Should redirect to home page or login
3. Verify token is cleared:
```javascript
console.log("Token after logout:", localStorage.getItem("authToken"));
// Expected: null
```

---

## Test Scenario 2: Company Login and Role-Based Access

### Objective
Verify that company users can login, access company routes, and cannot access farmer-only routes.

### Steps

#### Step 2.1: Login as Company
1. Go to `/login`
2. Enter Email: `company@example.com`
3. Enter Password: `password123`
4. Click "Login"

#### Step 2.2: Verify Redirect to Company Dashboard
- ✅ Should redirect to `/company/options`
- ✅ URL should show: `http://localhost:5173/company/options`

#### Step 2.3: Verify Navbar Shows Company Role
```javascript
const { user } = useAuth();
console.log("Current role:", user?.role);
// Expected: "company"
```

#### Step 2.4: Try to Access Farmer-Only Route
1. Manually navigate to `/farmer/options`
2. Should show "Access Denied" message
3. Should display: "Required role(s): farmer | Your role: company"

#### Step 2.5: Verify Cannot Access Farmer Dashboard
1. Try navigating to `/farmer/dashboard`
2. Should show access denied or redirect
3. Cannot see farmer-specific features

#### Step 2.6: Verify Authorization Header in Company Requests
1. Go to "Network" tab in DevTools
2. Click link in `/company` routes
3. Inspect request headers
4. Should see: `Authorization: Bearer <token>`

---

## Test Scenario 3: Invalid/Expired Token Handling

### Objective
Verify that invalid or expired tokens are properly rejected.

### Steps

#### Step 3.1: Tamper with Token
```javascript
// In console, while logged in
const token = localStorage.getItem("authToken");
const tampered = token.substring(0, token.length - 5) + "XXXXX"; // Modify last 5 chars
localStorage.setItem("authToken", tampered);
```

#### Step 3.2: Try to Make API Request
1. Navigate to any protected route that makes API calls
2. Open DevTools Network tab
3. Try to access data
4. Should get 401 Unauthorized error

#### Step 3.3: Verify Token is Cleared
```javascript
console.log("Token cleared?", localStorage.getItem("authToken"));
// Expected: null
```

#### Step 3.4: Verify Redirect to Login
- ✅ Should redirect to `/login`
- ✅ Should show error message about invalid token

#### Step 3.5: Re-login and Verify Recovery
1. Login again with correct credentials
2. Should work normally
3. New valid token should be stored

---

## Test Scenario 4: API Endpoints Protection

### Objective
Verify that protected API endpoints reject requests without tokens and accept requests with valid tokens.

### Steps (Using cURL in Terminal)

#### Step 4.1: Try to Access Protected Endpoint Without Token
```bash
curl -X GET http://localhost:5000/api/user/me

# Expected Response (Status 401):
# {"error":"Authorization header with Bearer token is required"}
```

#### Step 4.2: Get Valid Token
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"password123"}'

# Response: {"token":"eyJhbGciOiJ..."}

# Save token to environment variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Step 4.3: Access Protected Endpoint WITH Token
```bash
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer $TOKEN"

# Expected Response (Status 200):
# {"message":"Authenticated successfully","user":{"userId":1,"role":"farmer"}}
```

#### Step 4.4: Try Role-Protected Endpoint as Farmer
```bash
curl -X GET http://localhost:5000/api/farmer/protected-summary \
  -H "Authorization: Bearer $TOKEN"

# Expected Response (Status 200):
# {"message":"Welcome Farmer! You have access to this exclusive farmer resource.","user":{"userId":1,"role":"farmer"}}
```

#### Step 4.5: Try Role-Protected Endpoint as Wrong Role
```bash
# Get company token first
COMPANY_TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"company@example.com","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Try to access farmer-only endpoint with company token
curl -X GET http://localhost:5000/api/farmer/protected-summary \
  -H "Authorization: Bearer $COMPANY_TOKEN"

# Expected Response (Status 403):
# {"error":"Access denied. Requires one of the following roles: farmer"}
```

---

## Test Scenario 5: Token Persistence Across Page Reload

### Objective
Verify that token persists in localStorage and is restored after page reload.

### Steps

#### Step 5.1: Login
1. Go to `/login`
2. Login with valid credentials
3. Verify redirect to appropriate dashboard

#### Step 5.2: Check Token Before Reload
```javascript
console.log("Token before reload:", localStorage.getItem("authToken"));
// Expected: Long JWT token
```

#### Step 5.3: Reload Page
Press `F5` or `Ctrl+R` to reload

#### Step 5.4: Check Token After Reload
```javascript
console.log("Token after reload:", localStorage.getItem("authToken"));
// Expected: Same JWT token (not null)
```

#### Step 5.5: Verify User is Still Logged In
```javascript
const { isAuthenticated, user } = useAuth();
console.log("Still authenticated?", isAuthenticated);
console.log("User:", user);
// Expected: isAuthenticated = true, user = { userId, role, ... }
```

#### Step 5.6: Verify API Calls Work
1. Navigate through protected routes
2. Make API calls
3. Should all work without re-login

---

## Test Scenario 6: Simultaneous Tab Sessions

### Objective
Verify that logging out in one tab affects other tabs (if desired behavior).

### Steps

#### Step 6.1: Open Two Browser Tabs
1. Tab A: `http://localhost:5173`
2. Tab B: `http://localhost:5173`

#### Step 6.2: Login in Tab A
1. Go to `/login` in Tab A
2. Login with valid credentials
3. Should redirect to dashboard

#### Step 6.3: Check localStorage in Both Tabs
```javascript
// In both tabs, console shows:
localStorage.getItem("authToken")
// Expected: Same token in both tabs (shared localStorage)
```

#### Step 6.4: Logout in Tab A
1. Click Logout in Tab A
2. Token removed from localStorage

#### Step 6.5: Check Tab B
```javascript
// In Tab B console:
localStorage.getItem("authToken")
// Expected: null (logout in one tab clears for all tabs)
```

#### Step 6.6: Try to Access Protected Route in Tab B
1. Navigate to protected route in Tab B
2. Should show loading or redirect to login
3. Request should fail with 401 (no token in localStorage)

---

## Test Scenario 7: Multiple Rapid Requests

### Objective
Verify that multiple simultaneous API requests all include the Authorization header.

### Steps

#### Step 7.1: Login
1. Login to get valid token
2. Navigate to a page that makes multiple API calls

#### Step 7.2: Monitor Network Tab
1. Open DevTools → Network
2. Go to a page like `/farmer/dashboard`
3. Filter by XHR or Fetch requests

#### Step 7.3: Verify All Requests Have Authorization Header
- [ ] `/api/listings/mine?farmerId=1` → Has Authorization header
- [ ] `/api/listings/{id}/offers` → Has Authorization header
- [ ] `/api/*/...` → All have Authorization header

#### Step 7.4: Verify No Mixed Responses
```javascript
// Check that no 401 errors appear while token is valid
// (In Network tab, all requests should return 200/201/etc, not 401)
```

---

## Test Scenario 8: Password Reset & Re-login

### Objective
Verify that user can logout, login with new/different password.

### Steps

#### Step 8.1: Login with First Credential
1. Login with: `farmer@example.com` / `password123`
2. Verify successful login and redirect

#### Step 8.2: Logout
1. Click Logout button
2. Token cleared
3. Redirected to home

#### Step 8.3: Re-login with Same Credential
1. Navigate to `/login`
2. Login with same: `farmer@example.com` / `password123`
3. Should work
4. Verify new token is generated (different from before)

#### Step 8.4: Try Wrong Password
1. Logout again
2. Navigate to `/login`
3. Enter: `farmer@example.com` / `wrongpassword`
4. Should show error: "Invalid username or password"
5. Should NOT redirect or create token

---

## Test Scenario 9: Role-Based Dashboard Routing

### Objective
Verify that users are routed to correct dashboard based on role.

### Steps

#### Step 9.1: Login as Farmer
1. Navigate to `/login`
2. Login with farmer credentials
3. Should redirect to `/farmer/options`
4. Should display farmer UI

#### Step 9.2: Check All Farmer Routes
- [ ] `/farmer/options` → Works
- [ ] `/farmer/buy` → Works
- [ ] `/farmer/sell` → Works
- [ ] `/farmer/dashboard` → Works

#### Step 9.3: Verify Cannot Access Company Routes
- [ ] `/company/options` → Shows access denied
- [ ] `/company/buy` → Shows access denied
- [ ] `/company/sell` → Shows access denied

#### Step 9.4: Logout and Login as Company
1. Logout from farmer account
2. Login with company credentials
3. Should redirect to `/company/options`

#### Step 9.5: Check All Company Routes
- [ ] `/company/options` → Works
- [ ] `/company/buy` → Works
- [ ] `/company/sell` → Works

#### Step 9.6: Verify Cannot Access Farmer Routes
- [ ] `/farmer/options` → Shows access denied
- [ ] `/farmer/dashboard` → Shows access denied

---

## Test Scenario 10: Performance & Load Test

### Objective
Verify that authentication doesn't cause performance issues under normal usage.

### Steps

#### Step 10.1: Baseline Performance
1. Open DevTools → Performance tab
2. Login
3. Record performance
4. Should complete in < 2 seconds

#### Step 10.2: API Call Performance
1. Make rapid API calls (10+)
2. Each call should include token instantly
3. Network requests should be < 100ms each
4. No hanging requests

#### Step 10.3: Memory Check
1. Open DevTools → Memory
2. Check memory usage
3. Token storage should use < 1KB
4. No memory leaks after multiple logouts

#### Step 10.4: Token Decode Performance
```javascript
// Measure token decoding performance
const token = localStorage.getItem("authToken");
console.time("decode");
for (let i = 0; i < 1000; i++) {
  const payload = JSON.parse(atob(token.split('.')[1]));
}
console.timeEnd("decode");
// Expected: < 10ms (very fast)
```

---

## Verification Checklist

### Authentication Verification
- [ ] Login endpoint is `/api/auth/login`
- [ ] Login request field is `email` (not username)
- [ ] Response contains `token` field
- [ ] Token format is valid JWT (3 parts separated by dots)
- [ ] Token can be decoded to show userId and role
- [ ] Token has expiration date in future

### Token Storage Verification
- [ ] Token stored in localStorage with key `authToken`
- [ ] Token persists across page reload
- [ ] Token cleared on logout
- [ ] Token cleared on 401 response
- [ ] No token stored in URL or cookies

### Request Authorization Verification
- [ ] Authorization header format: `Bearer <token>`
- [ ] All API requests include Authorization header
- [ ] GET, POST, PATCH, DELETE all include header
- [ ] No Authorization header for public routes

### Role-Based Access Verification
- [ ] Farmer can access farmer routes
- [ ] Company can access company routes
- [ ] Farmer cannot access company routes (403)
- [ ] Company cannot access farmer routes (403)
- [ ] Correct error message shows required role

### Error Handling Verification
- [ ] 401 response clears token
- [ ] 401 response redirects to login
- [ ] 403 response shows access denied
- [ ] Invalid token is rejected
- [ ] Expired token is rejected
- [ ] Network errors handled gracefully

### UI/UX Verification
- [ ] Logout button visible when authenticated
- [ ] Login button visible when not authenticated
- [ ] Loading spinner shows during auth check
- [ ] Error messages are clear and actionable
- [ ] No sensitive info in error messages
- [ ] Smooth transitions between pages

---

## Expected Test Duration

| Scenario | Duration |
|----------|----------|
| 1 (Farmer Login) | 5 minutes |
| 2 (Company Login) | 5 minutes |
| 3 (Invalid Token) | 3 minutes |
| 4 (API Protection) | 5 minutes |
| 5 (Page Reload) | 2 minutes |
| 6 (Multi-tab) | 3 minutes |
| 7 (Rapid Requests) | 2 minutes |
| 8 (Re-login) | 3 minutes |
| 9 (Role Routing) | 5 minutes |
| 10 (Performance) | 5 minutes |
| **Total** | **~40 minutes** |

---

## Common Test Failures & Solutions

### Test Fails: Token not stored after login
**Solution**:
1. Verify Login.tsx calls `login(data.token)`
2. Check if response status is 200
3. Verify token field exists in response
4. Check browser localStorage is enabled

### Test Fails: Authorization header missing
**Solution**:
1. Verify `apiRequest()` function includes header logic
2. Verify token exists in localStorage
3. Check token is not empty/null
4. Restart frontend to clear cached code

### Test Fails: Redirect not working
**Solution**:
1. Verify role is correctly extracted from token
2. Check navigation function is working
3. Verify route paths are correct
4. Check for JavaScript errors in console

### Test Fails: 401 on every request
**Solution**:
1. Verify token exists: `localStorage.getItem("authToken")`
2. Verify token is not expired
3. Verify Authorization header format
4. Verify backend JWT_SECRET matches

### Test Fails: Logout button not appearing
**Solution**:
1. Verify AuthProvider wraps entire app
2. Verify useAuth() hook is called
3. Verify isAuthenticated state is true
4. Check for JavaScript errors in console

---

## Success Criteria

✅ **All tests pass when**:
- User can login and token is stored
- Token is included in all API requests
- User can access routes matching their role
- User cannot access routes requiring different role
- Logout clears token and redirects
- Invalid/expired tokens are rejected
- Multiple pages work without re-login
- No JavaScript errors in console
- All network requests complete in reasonable time

---

## Test Environment

### Recommended Hardware
- CPU: 2+ cores
- RAM: 4GB+
- Storage: 500MB free

### Browser Requirements
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- localStorage must be enabled

### Network Requirements
- Stable internet connection
- localhost communication (no firewall blocking)
- No proxy interfering with localhost requests

---

## Sign-off Template

```
Test Date: [DATE]
Tester: [NAME]
Environment: [LOCAL/STAGING/PRODUCTION]

Test Scenario 1 (Farmer Login): [PASS/FAIL] - Notes: _________
Test Scenario 2 (Company Login): [PASS/FAIL] - Notes: _________
Test Scenario 3 (Token Handling): [PASS/FAIL] - Notes: _________
Test Scenario 4 (API Protection): [PASS/FAIL] - Notes: _________
Test Scenario 5 (Persistence): [PASS/FAIL] - Notes: _________
Test Scenario 6 (Multi-tab): [PASS/FAIL] - Notes: _________
Test Scenario 7 (Rapid Requests): [PASS/FAIL] - Notes: _________
Test Scenario 8 (Re-login): [PASS/FAIL] - Notes: _________
Test Scenario 9 (Role Routing): [PASS/FAIL] - Notes: _________
Test Scenario 10 (Performance): [PASS/FAIL] - Notes: _________

Overall Result: [PASS/FAIL WITH NOTED ISSUES/FAIL]

Critical Issues Found: _________
Recommended Actions: _________
Sign-off Date: [DATE]
```

---

**Document Status**: Ready for Testing  
**Last Updated**: August 31, 2026
