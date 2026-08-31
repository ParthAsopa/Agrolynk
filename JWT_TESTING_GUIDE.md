# JWT Authentication Testing Guide - AgroLynk

## Quick Start Testing

### 1. Prerequisites

- Server running on `http://localhost:5000` or your configured port
- Frontend running on `http://localhost:5173` (Vite default)
- User account created (can create via `/api/auth/register` or use seed data)

### 2. Manual Testing with cURL

#### Test 2.1: Login and Get JWT Token

```bash
# Login request
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "password123"
  }'

# Expected Response (Status 200):
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJmYXJtZXIiLCJpYXQiOjE2OTQwMDAwMDAsImV4cCI6MTY5NDA2MDAwMDB9.abc123..."}

# Save token to variable for testing
TOKEN="<paste_token_here>"
```

#### Test 2.2: Access Protected Route with Token

```bash
# Request with Authorization header
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer $TOKEN"

# Expected Response (Status 200):
# {"message":"Authenticated successfully","user":{"userId":1,"role":"farmer"}}
```

#### Test 2.3: Attempt Protected Route Without Token (Should Fail)

```bash
curl -X GET http://localhost:5000/api/user/me

# Expected Response (Status 401):
# {"error":"Authorization header with Bearer token is required"}
```

#### Test 2.4: Attempt Protected Route with Invalid Token (Should Fail)

```bash
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer invalid.token.here"

# Expected Response (Status 401):
# {"error":"Invalid or expired token"}
```

#### Test 2.5: Access Role-Protected Route

```bash
# Farmer accessing farmer-only route
curl -X GET http://localhost:5000/api/farmer/protected-summary \
  -H "Authorization: Bearer $TOKEN"

# Expected Response (Status 200):
# {"message":"Welcome Farmer! You have access to this exclusive farmer resource.","user":{"userId":1,"role":"farmer"}}

# Company accessing same route (should fail with 403)
# (Replace token with company token)
curl -X GET http://localhost:5000/api/farmer/protected-summary \
  -H "Authorization: Bearer <company_token>"

# Expected Response (Status 403):
# {"error":"Access denied. Requires one of the following roles: farmer"}
```

---

## 3. Frontend Browser Testing

### Test 3.1: Login Flow

1. Navigate to `http://localhost:5173/login`
2. Enter email: `farmer@example.com`
3. Enter password: `password123`
4. Click "Login"

**Expected Results**:

- ✅ Login succeeds
- ✅ User is redirected to `/farmer/options`
- ✅ Token is stored in browser localStorage under key `authToken`
- ✅ No error messages displayed

**How to Verify Token in Browser**:

```javascript
// Open browser DevTools → Console → paste:
console.log(localStorage.getItem("authToken"));
// Should print the JWT token

// Decode token to see contents:
const token = localStorage.getItem("authToken");
const payload = JSON.parse(atob(token.split(".")[1]));
console.log(payload);
// Should show: { userId: 1, role: "farmer", iat: ..., exp: ... }
```

### Test 3.2: Verify Token is Sent in API Requests

1. Login successfully (from Test 3.1)
2. Open DevTools → Network tab
3. Navigate to `/farmer/options`
4. Observe network requests

**Expected Results**:

- ✅ Requests to `/api/listings/mine*`, `/api/listings/{id}/offers` include `Authorization` header
- ✅ Authorization header format: `Bearer eyJhbGciOiJ...`
- ✅ Requests return data with status 200
- ✅ No 401 Unauthorized errors

**How to Check Request Headers in DevTools**:

1. Right-click any request → "Copy as cURL"
2. Look for header: `Authorization: Bearer ...`

### Test 3.3: Protected Route Access by Role

1. Login as farmer
2. Verify access to farmer-specific routes:
   - `/farmer/options` ✅ Should work
   - `/farmer/dashboard` ✅ Should work
   - `/farmer/buy` ✅ Should work
   - `/farmer/sell` ✅ Should work

3. Login as company
4. Verify access to company-specific routes:
   - `/company/options` ✅ Should work
   - `/company/buy` ✅ Should work
   - `/company/sell` ✅ Should work

### Test 3.4: Token Expiration

1. Login successfully
2. Inspect token expiration time:

```javascript
const token = localStorage.getItem("authToken");
const payload = JSON.parse(atob(token.split(".")[1]));
const expTime = new Date(payload.exp * 1000);
console.log("Token expires at:", expTime);
```

3. Wait for expiration or modify system time (for quick testing)
4. Try to access protected route

**Expected Results**:

- ✅ After expiration, API returns 401
- ✅ Token is cleared from localStorage
- ✅ User might be redirected to login (depends on implementation)

### Test 3.5: Logout Functionality

1. Login successfully
2. Locate logout button/functionality
3. Click logout

**Expected Results**:

- ✅ Token is removed from localStorage
- ✅ User is redirected to home page or login
- ✅ localStorage.getItem("authToken") returns null

---

## 4. Integration Testing Checklist

### Authentication Flow

- [ ] User can register with email/password/role
- [ ] User can login with email/password
- [ ] Login returns a valid JWT token
- [ ] Token is extracted and stored in localStorage
- [ ] Token contains correct userId and role claims
- [ ] Token has 7-day expiration

### Token Attachment

- [ ] API requests include Authorization header
- [ ] Authorization header format is "Bearer <token>"
- [ ] Token is read from localStorage for each request
- [ ] Token is included in both GET and POST requests
- [ ] Token is included in query string requests (pagination, filters)

### Authorization & Role-Based Access

- [ ] Farmer can access farmer routes
- [ ] Company can access company routes
- [ ] Farmer cannot access company routes (403)
- [ ] Company cannot access farmer routes (403)
- [ ] Unauthenticated users cannot access protected routes (401)

### Token Validation

- [ ] Invalid token returns 401
- [ ] Malformed token returns 401
- [ ] Expired token returns 401
- [ ] Missing token returns 401
- [ ] Tampered token returns 401

### Error Handling

- [ ] 401 response clears token from localStorage
- [ ] Repeated 401 errors don't spam logout
- [ ] Error messages are user-friendly
- [ ] Errors don't expose sensitive information

### Session Management

- [ ] Token persists across page reloads (while valid)
- [ ] Token is cleared on explicit logout
- [ ] Token is cleared on expiration
- [ ] User can immediately re-login after logout
- [ ] Multiple tabs share same token

---

## 5. Network Request Examples

### Successful Protected Request

```
GET /api/listings/mine?farmerId=1 HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJmYXJtZXIifQ.sig
Content-Type: application/json

Response (200 OK):
[
  {
    "id": 1,
    "farmerId": 1,
    "crop": "wheat",
    "quantity": 100,
    ...
  }
]
```

### Failed - Missing Authorization Header

```
GET /api/listings/mine?farmerId=1 HTTP/1.1
Host: localhost:5000
Content-Type: application/json

Response (401 Unauthorized):
{
  "error": "Authorization header with Bearer token is required"
}
```

### Failed - Invalid Token

```
GET /api/listings/mine?farmerId=1 HTTP/1.1
Host: localhost:5000
Authorization: Bearer invalid.token.format
Content-Type: application/json

Response (401 Unauthorized):
{
  "error": "Invalid or expired token"
}
```

---

## 6. Debugging Guide

### Issue: Token not stored after login

**Debug Steps**:

1. Open DevTools → Console
2. Check login response:
   ```javascript
   // Manually test fetch
   const res = await fetch("/api/auth/login", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       email: "farmer@example.com",
       password: "password123",
     }),
   });
   const data = await res.json();
   console.log("Response:", data);
   ```
3. Verify response contains `token` field
4. Check if `login()` function is being called from AuthContext
5. Verify localStorage shows the token: `localStorage.getItem("authToken")`

### Issue: API requests missing Authorization header

**Debug Steps**:

1. Open DevTools → Network tab
2. Make any API request (e.g., navigate to farmer dashboard)
3. Click on request → Headers
4. Look for "Authorization" header
5. Check that it starts with "Bearer "
6. If missing:
   - Verify token exists: `localStorage.getItem("authToken")`
   - Check that `apiRequest()` function includes auth header
   - Check that `getQueryFn()` function includes auth header

### Issue: Getting 401 Unauthorized on protected routes

**Debug Steps**:

1. Open DevTools → Console
2. Check token validity:
   ```javascript
   const token = localStorage.getItem("authToken");
   const payload = JSON.parse(atob(token.split(".")[1]));
   console.log("Token expires at:", new Date(payload.exp * 1000));
   console.log("Is expired?", payload.exp < Date.now() / 1000);
   ```
3. Check token format: Should have 3 parts separated by dots
4. Check Authorization header in request: `Bearer <token>`
5. Verify server is using same JWT_SECRET

### Issue: User not redirected after login

**Debug Steps**:

1. Verify login succeeded (check response status)
2. Verify token is valid and not expired
3. Check if role is correctly parsed from token
4. Verify navigation function is working:
   ```javascript
   // In browser console after login
   console.log("Auth state:", useAuth()); // If inside component
   ```
5. Check browser console for any JavaScript errors

### Issue: CORS errors when making API requests

**Debug Steps**:

1. Check server has CORS enabled: `app.use(cors());`
2. Verify frontend URL matches CORS whitelist
3. Check Authorization header doesn't trigger CORS preflight issues
4. Review server logs for CORS error details

---

## 7. Cleanup & Reset

### Reset Authentication State

```javascript
// In browser DevTools Console:
localStorage.removeItem("authToken");
sessionStorage.clear();
location.reload(); // Refresh page
```

### Reset Database (if available)

```bash
# Re-seed database with test data
npm run db:seed
```

### Check Logs

```bash
# Server logs (in development)
# Should see login attempts and token validations
# Watch for error messages in terminal running dev server
```

---

## 8. Performance Considerations

### Token Size

- JWT tokens are relatively large (typically 300-500 bytes)
- Each token is sent with every API request
- Consider gzip compression in production

### Token Validation Time

- Token verification is fast (milliseconds)
- No database lookup needed, just signature verification
- Scalable to millions of concurrent users

### Caching Strategy

- Don't cache responses requiring authentication
- Use appropriate Cache-Control headers
- Let browser handle token refresh logic

---

## 9. Security Testing

### ✅ Things That Should Work

- Valid token accesses protected routes
- Role-based access control enforced
- Token expiration prevents indefinite access
- Password is hashed with bcrypt (not stored plaintext)

### ❌ Things That Should FAIL

- Invalid token is rejected
- Tampered token is rejected
- Expired token is rejected
- Missing Authorization header is rejected
- Wrong role accessing protected route is rejected

### Penetration Testing Tips

- Try SQL injection in email field during login
- Try oversized tokens to detect buffer overflow
- Try token replay from expired sessions
- Try to modify JWT claims client-side
- Try to forge JWT without server secret

---

## 10. Monitoring & Observability

### Key Metrics to Track

- Login success/failure rate
- Token validation errors
- 401 Unauthorized response frequency
- Average token lifetime before expiration
- Failed password attempts per account

### Logging Recommendations

```typescript
// Log authentication events
console.log("Login attempt:", { email, timestamp });
console.log("Token generated:", { userId, role, expiresIn: "7d" });
console.log("Token validation:", { userId, valid: true / false });
console.log("Unauthorized request:", { route, reason });
```

### Recommended Monitoring

- Set up alerts for high 401 error rates
- Track unusual login patterns
- Monitor token generation rate
- Alert on potential brute-force attacks

---

## 11. Production Deployment Checklist

- [ ] JWT_SECRET is set in environment variables (not hardcoded)
- [ ] Frontend uses HTTPS only (no HTTP)
- [ ] Backend uses HTTPS only (no HTTP)
- [ ] CORS is properly configured for production domain only
- [ ] Token expiration is appropriate (7 days may be too long for sensitive apps)
- [ ] Refresh token endpoint is implemented (optional but recommended)
- [ ] Rate limiting is configured on login endpoint
- [ ] Database connection is secure (SSL/TLS)
- [ ] Logs don't contain sensitive information (passwords, tokens)
- [ ] Error messages don't leak information about users
- [ ] OWASP guidelines are followed
- [ ] Security headers are set (Content-Security-Policy, etc.)
- [ ] Regular security audits are scheduled

---

## Summary

The JWT authentication flow is now **fully implemented** with:

- ✅ Server-side token generation and validation
- ✅ Client-side token storage in localStorage
- ✅ Authorization header attachment to all API requests
- ✅ Role-based access control
- ✅ AuthContext for global state management
- ✅ Token expiration handling

Use this testing guide to verify everything works correctly throughout the development lifecycle.
