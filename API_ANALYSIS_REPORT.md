# API Analysis Report: Frontend-Backend Mismatch Detection

## Summary

Analysis of fetch requests in React components vs Express server routes and Zod schemas identified **1 critical issue** and **several minor inconsistencies**.

---

## Critical Issues 🔴

### 1. Login Endpoint Mismatch

**Severity:** CRITICAL - Authentication will fail

#### Frontend Issue

- **File:** [client/src/pages/Login.tsx](client/src/pages/Login.tsx#L23)
- **Endpoint Called:** `POST /api/login`
- **Body Parameters:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

#### Server Implementation

- **File:** [server/routes.ts](server/routes.ts#L148)
- **Actual Endpoint:** `POST /api/auth/login`
- **Expected Body Parameters:**
  ```json
  {
    "email": "string@email.com",
    "password": "string"
  }
  ```
- **Schema:** `loginSchema` requires `email`, not `username`

#### Problems

1. ❌ Wrong endpoint path (`/api/login` vs `/api/auth/login`)
2. ❌ Wrong field name (`username` vs `email`)
3. ❌ No error handling for 404 when endpoint doesn't exist

#### Fix Required

Update [client/src/pages/Login.tsx](client/src/pages/Login.tsx#L23):

```typescript
// BEFORE
const response = await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: username.trim(),
    password,
  }),
});

// AFTER
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: username.trim(), // Note: frontend uses username input but sends as email
    password,
  }),
});
```

---

## Confirmed Working Endpoints ✅

### Farmer Buy Endpoint

- **Frontend:** [client/src/pages/farmer/Buy.tsx](client/src/pages/farmer/Buy.tsx#L48)
- **Server:** [server/routes.ts](server/routes.ts#L216)
- **Status:** ✅ WORKING
- **Query Parameters:** `crop`, `location`, `farmSize` (all match schema `buyQuerySchema`)
- **Note:** Frontend uses `useQuery` with manual queryKey construction

### Farmer Sell Endpoint (Market Insights)

- **Frontend:** [client/src/pages/farmer/Sell.tsx](client/src/pages/farmer/Sell.tsx#L71)
- **Server:** [server/routes.ts](server/routes.ts#L226)
- **Status:** ✅ WORKING
- **Query Parameters:** `crop`, `location`, `quantity` (all match `sellQuerySchema`)

### AI Price Recommendation

- **Frontend:** [client/src/pages/farmer/Sell.tsx](client/src/pages/farmer/Sell.tsx#L90)
- **Server:** [server/routes.ts](server/routes.ts#L340)
- **Status:** ✅ WORKING
- **Request Body Fields:**
  - `crop`: string ✅
  - `quantity`: number ✅
  - `location`: string ✅
  - `quality`: string ✅
- **Response:** `{ recommendedPrice, priceRange: { min, max }, reason }`

### AI Match Endpoint

- **Frontend:** [client/src/pages/company/Buy.tsx](client/src/pages/company/Buy.tsx#L204)
- **Server:** [server/routes.ts](server/routes.ts#L427)
- **Status:** ✅ WORKING
- **Request Structure:**
  ```json
  {
    "listing": {
      "crop": "string",
      "quantity": "number",
      "quality": "string",
      "location": "string (optional)"
    },
    "company": {
      "name": "string",
      "requiredCrop": "string",
      "requiredQuantity": "number",
      "requiredQuality": "string"
    }
  }
  ```

### Company Orders Endpoint

- **Frontend:** [client/src/pages/company/Buy.tsx](client/src/pages/company/Buy.tsx#L238)
- **Server:** [server/routes.ts](server/routes.ts#L538)
- **Status:** ✅ WORKING
- **Request Body:**
  ```json
  {
    "companyId": "number",
    "crop": "string",
    "quantity": "number",
    "gradeQuality": "enum (premium|standard|economy)",
    "totalCost": "number"
  }
  ```

### Company Products Endpoint

- **Frontend:** [client/src/pages/company/Sell.tsx](client/src/pages/company/Sell.tsx#L224)
- **Server:** [server/routes.ts](server/routes.ts#L560)
- **Status:** ✅ WORKING
- **Request Body:** All fields match `createCompanyProductSchema`

### Farmer Dashboard - List Listings

- **Frontend:** [client/src/pages/farmer/Dashboard.tsx](client/src/pages/farmer/Dashboard.tsx#L60)
- **Server:** [server/routes.ts](server/routes.ts#L263)
- **Status:** ✅ WORKING
- **Query Parameter:** `farmerId` (numeric)

### Farmer Dashboard - Get Offers for Listing

- **Frontend:** [client/src/pages/farmer/Dashboard.tsx](client/src/pages/farmer/Dashboard.tsx#L76)
- **Server:** [server/routes.ts](server/routes.ts#L308)
- **Status:** ✅ WORKING
- **Route:** `GET /api/listings/:id/offers`

### Farmer Dashboard - Update Offer Status

- **Frontend:** [client/src/pages/farmer/Dashboard.tsx](client/src/pages/farmer/Dashboard.tsx#L132)
- **Server:** [server/routes.ts](server/routes.ts#L332)
- **Status:** ✅ WORKING
- **Route:** `PATCH /api/offers/:id/status`
- **Body:** `{ status: "accepted" | "rejected" }`

### Farmer Dashboard - Create Listing

- **Frontend:** [client/src/pages/farmer/Dashboard.tsx](client/src/pages/farmer/Dashboard.tsx#L89)
- **Server:** [server/routes.ts](server/routes.ts#L236)
- **Status:** ✅ WORKING
- **All Fields Match:** `farmerId`, `crop`, `wasteType`, `quantity`, `unit`, `location`, `price`

---

## Data Type Consistency Check

### Numeric Fields

All numeric fields are properly coerced using `z.coerce.number()` in server schemas:

- ✅ `quantity`: coerced to number
- ✅ `farmSize`: coerced to number
- ✅ `price`: coerced to number
- ✅ `farmerId`: coerced to positive integer
- ✅ `companyId`: coerced to positive integer

### String Enums

All enum validations are correct:

- ✅ `gradeQuality`: validates `["premium", "standard", "economy"]`
- ✅ `category`: validates `["seeds", "fertilizers", "pesticides", "instruments"]`
- ✅ `status`: validates `["active", "inactive", "sold"]` or `["accepted", "rejected"]`

### Required Fields vs Optional

- ✅ `imageUrl`: properly marked as optional in both frontend and schema
- ✅ `manufacturer`: optional
- ✅ `specifications`: optional
- ✅ `message`: optional in offers

---

## Minor Observations

### 1. API Request Wrapper Function

- **Location:** [client/src/lib/queryClient.ts](client/src/lib/queryClient.ts)
- **Status:** ✅ Good practice
- Properly handles:
  - Credential inclusion for cookies
  - Content-Type headers
  - Error throwing for non-200 responses
  - Manual apiRequest for POST/PATCH operations

### 2. Query Client Setup

- **Configuration:** Reasonable defaults
  - No refetch on window focus ✅
  - Infinite stale time ✅
  - No retry on failure ✅

### 3. Form Validation

- **Frontend & Server:** Both use Zod schemas
- **Consistency:** ✅ Frontend validation provides UX feedback, server validates request body
- **Missing:** Frontend doesn't always import schemas from shared/schema.ts (uses local Zod definitions instead)

---

## Recommendations

### High Priority

1. **Fix Login Endpoint** (Critical)
   - Update endpoint path to `/api/auth/login`
   - Change body parameter from `username` to `email`
   - Consider UX: keep username input field but clarify it accepts email

### Medium Priority

2. **Centralize Zod Schemas**
   - Move frontend form schemas to [shared/schema.ts](shared/schema.ts)
   - Import validation schemas from shared rather than defining locally
   - Ensures single source of truth for validation rules

3. **Add Registration Flow**
   - Server has `/api/auth/register` endpoint
   - Frontend missing registration page/flow
   - Server expects `registerSchema` with `email` field

4. **Authentication State Management**
   - Frontend needs to store JWT token from login response
   - Currently no token storage or passing in subsequent requests
   - Consider adding auth context or state management

### Low Priority

5. **API Documentation**
   - Add JSDoc comments to apiRequest function
   - Document expected response types for each endpoint

---

## Testing Checklist

- [ ] Fix login endpoint and test authentication flow
- [ ] Verify all query parameters are properly URL-encoded
- [ ] Test numeric field coercion at boundaries (0, negative, large numbers)
- [ ] Verify enum validation rejects invalid values
- [ ] Test optional fields with null/undefined values
- [ ] Validate error response formats match between frontend and server

---

## Files Involved

### Frontend Components

- [client/src/pages/Login.tsx](client/src/pages/Login.tsx)
- [client/src/pages/farmer/Buy.tsx](client/src/pages/farmer/Buy.tsx)
- [client/src/pages/farmer/Sell.tsx](client/src/pages/farmer/Sell.tsx)
- [client/src/pages/farmer/Dashboard.tsx](client/src/pages/farmer/Dashboard.tsx)
- [client/src/pages/company/Buy.tsx](client/src/pages/company/Buy.tsx)
- [client/src/pages/company/Sell.tsx](client/src/pages/company/Sell.tsx)
- [client/src/lib/queryClient.ts](client/src/lib/queryClient.ts)

### Backend Routes

- [server/routes.ts](server/routes.ts)

### Shared Schemas

- [shared/schema.ts](shared/schema.ts)
