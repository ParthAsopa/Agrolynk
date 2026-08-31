# AgroLynk: Technical & Product Audit for Hackathon Pitch Deck

## 1) Executive Summary

AgroLynk is a B2B agricultural marketplace designed to solve one of the biggest inefficiencies in Indian agriculture: the massive waste of crop residue and byproducts caused by weak market access, poor price discovery, and fragmented buyer-seller coordination.

The product connects two key groups:

- Farmers who generate crop waste or surplus agricultural biomass
- Agricultural companies, processors, and bulk buyers who need raw material inputs

Instead of letting crop residue burn in the field or sell at a deeply discounted rate through intermediaries, AgroLynk creates an AI-assisted marketplace where farmers can list waste and companies can discover, evaluate, and negotiate supply directly.

### Core Agricultural Problem AgroLynk Solves

The project targets a real and urgent agricultural pain point:

- Large quantities of crop residue and agricultural byproducts are generated every season
- Farmers often do not know the current market value of these materials
- Buyers are unaware of nearby supply sources
- Farmers lack access to industrial demand and transparent pricing
- Valuable biomass is wasted, burned, or sold below fair value

The platform reduces this imbalance by combining:

- direct listings from farmers
- AI-generated pricing guidance
- AI-based product compatibility matching
- role-based workflows for farmers and companies
- a simple marketplace experience for discovery and negotiation

### Target Personas and Primary Value

#### 1. Farmers

Primary user need:

- monetize crop residue and agricultural waste instead of burning it
- understand fair pricing before listing
- receive direct buyer interest without middlemen

Primary value deliverable:

- Access to demand, price guidance, and direct order/offers from buyers
- Better revenue realization from waste products and surplus biomass

#### 2. Agricultural Companies / Buyers

Primary user need:

- source consistent raw materials at the right quality and price
- quickly evaluate multiple supply options
- reduce procurement friction and discover farmers nearby

Primary value deliverable:

- Fast supplier discovery, compatibility scoring, and offer workflow for procurement decisions
- More transparent and efficient sourcing of agricultural byproducts and inputs

---

## 2) Product Positioning & Value Proposition

AgroLynk is positioned as an AI-powered agricultural supply network for crop waste and agricultural byproducts.

### Product Promise

AgroLynk turns agricultural waste into a tradable asset by combining:

- real market intelligence
- farmer-side listing workflows
- buyer-side matching and offer systems
- AI recommendations for price and compatibility

### Why the Product is Interesting for a Hackathon

This is not a generic marketplace. It solves a high-impact regional problem with clear user flows and a practical B2B use case:

- data-rich but underserved domain
- direct farmer-company channel
- AI assistance that is tangible and explainable
- simple MVP with credible market logic and business value

### Business Story for Pitch Deck

"Farmers are losing money and burning value. Manufacturers and procurement teams are struggling to find reliable waste inputs. AgroLynk creates the trust layer and intelligence layer that turns agricultural waste into a discoverable, priced, and transactional supply stream."

---

## 3) Full Tech Stack & System Architecture

### Frontend Stack

The client is a Vite + React + TypeScript application built with a modern component system and a tailored agricultural UI theme.

Core frontend stack:

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Wouter for routing
- React Query for server-state management
- React Hook Form + Zod validation
- Auth Context for token-based session handling
- ShadCN-inspired component library under client/src/components/ui
- Dark mode support via a custom theme system
- Multi-language support via a LanguageContext and locale files

### Frontend Architecture

The app has role-based screens and flows:

- Home landing page
- Login / Register
- Farmer options, buy, sell, dashboard
- Company options, buy, sell
- Shared global layout, theme toggle, auth state, toast notifications

### Backend Stack

The server is built with Node.js and Express in TypeScript.

Core backend stack:

- Node.js
- Express
- TypeScript
- REST API route architecture
- JWT-based authentication
- bcryptjs password hashing
- Helmet security headers
- CORS
- express-rate-limit baseline protection
- Drizzle ORM for PostgreSQL access
- MemStorage fallback for local/offline/demo operation

### Database & Persistence Layer

Main persistence architecture:

- PostgreSQL as the primary database target
- Drizzle ORM for schema modeling and queries
- Neon serverless Postgres integration via @neondatabase/serverless
- Fallback in-memory storage to keep the app operational when DB credentials or database connectivity are unavailable

Important design detail:

- There is a DB layer in server/db.ts that initializes when DATABASE_URL is valid
- If not available, the application automatically falls back to MemStorage
- This supports demo reliability and local hackathon execution

### AI Framework

The AI layer is implemented through Google Gemini.

Core libraries:

- @google/genai
- custom prompt templates in server/routes.ts
- Gemini API call wrapper in server/utils/claude.ts
- JSON sanitization via cleanGeminiJson()
- structured parsing using JSON.parse
- Zod validation of incoming API request payloads to ensure contract correctness

The AI flows do the following:

- price recommendation for farm listings
- compatibility matching between a listing and a company requirement
- explanation-based outputs with justifications and summary content

### High-Level Architecture Diagram

```text
Browser / Client App
  -> React + Vite + Tailwind UI
  -> Wouter routes
  -> React Query data fetching
  -> Auth Context for JWT session state
  -> REST API calls to Express backend

Express API Server
  -> auth middleware
  -> listing / offer / order / product routes
  -> AI routes using Gemini
  -> PostgreSQL via Drizzle ORM
  -> fallback MemStorage for local/demo mode

Data Layer
  -> users
  -> listings
  -> offers
  -> companyProducts
  -> companyOrders
```

### Actual Codebase Observations

This repo is a strong prototype, with the following real implementation characteristics:

- the app is designed around a role-based marketplace flow
- the AI features are integrated into the backend and exposed through REST endpoints
- the in-memory fallback makes the app resilient during demo and low-setup runs
- the code is structured to support a credible hackathon demo and business pitch

Important audit note:

- The middleware files for JWT and role enforcement exist and are correctly implemented
- However, the route definitions currently largely rely on direct validation and not on explicit requireAuth / requireRole enforcement on most endpoints
- This is a deployment-security gap rather than a product gap, and one that is important to flag in a pitch or technical audit

---

## 4) Data Schemas & Models

The canonical data schema lives in shared/schema.ts and is the best reference for the actual system model.

### Users

Users are the shared identity model for both farmers and companies.

Fields:

- id: serial primary key
- name: string
- email: string, unique
- username: string, unique
- password: string (hashed server-side)
- role: "farmer" | "company"
- createdAt: timestamp

Validation logic:

- registration requires name, valid email, password length >= 8, role enum
- login requires email and password

### Listings

Listings represent farmer-supplied agricultural waste or surplus material available for sale.

Fields:

- id: serial primary key
- farmerId: integer, references users.id
- crop: string
- wasteType: string
- quantity: number
- unit: string
- location: string
- price: number
- status: string, default "active"

Example listing model:

```ts
{
  id: 1,
  farmerId: 12,
  crop: "rice",
  wasteType: "rice straw",
  quantity: 250,
  unit: "kg",
  location: "Punjab",
  price: 2400,
  status: "active"
}
```

Business meaning:

- A farmer lists available waste or byproduct supply
- The quantity and unit support actual trade negotiation
- The listing can move between active / inactive / sold via update routes

### Offers

Offers represent buyer expressions of interest on a specific listing.

Fields:

- id: serial primary key
- listingId: integer
- companyId: integer
- offeredPrice: number
- message: optional text
- status: default "pending"

Offer lifecycle:

- created as pending
- can be accepted or rejected
- when accepted, the related listing is marked sold
- pending offers for the same listing are auto-rejected to maintain a clean, single-winner workflow

### Company Products

Companies can maintain product listings for their own goods.

Fields:

- id: serial primary key
- companyId: integer
- category: one of seeds / fertilizers / pesticides / instruments
- name: string
- price: number
- quantity: number
- description: string
- manufacturer: nullable string
- specifications: nullable string
- imageUrl: nullable string

This supports company-side inventory and procurement cataloging.

### Company Orders

Company orders are business purchase records for crop/commodity acquisition.

Fields:

- id: serial primary key
- companyId: integer
- crop: string
- quantity: number
- gradeQuality: premium | standard | economy
- totalCost: number
- status: default "pending"

This is the buying side of the marketplace, representing direct procurement and fulfillment workflows.

---

## 5) Comprehensive API Endpoint Map

The server routes are defined primarily in server/routes.ts.

### Authentication Routes

| Method | Endpoint           | Auth Required | Purpose                                                   |
| ------ | ------------------ | ------------- | --------------------------------------------------------- |
| POST   | /api/auth/register | No            | Register a farmer or company with email + password + role |
| POST   | /api/auth/login    | No            | Authenticate and return a signed JWT                      |

#### Auth behavior

- input validated via Zod schemas
- passwords are hashed using bcryptjs
- JWT secret defaults to agrolynk_dev_secret_jwt_key if environment variable is missing
- JWT payload includes userId and role
- app falls back to MemStorage on DB failure

### Farmer Routes

| Method | Endpoint                 | Auth Required                | Purpose                                               |
| ------ | ------------------------ | ---------------------------- | ----------------------------------------------------- |
| GET    | /api/farmer/buy          | No                           | Return crop buy recommendation data from market logic |
| GET    | /api/farmer/sell         | No                           | Return market insight data by crop/location/quantity  |
| POST   | /api/listings            | No in current implementation | Create a farmer listing                               |
| GET    | /api/listings/mine       | No in current implementation | Fetch all listings for a farmer by farmerId           |
| PATCH  | /api/listings/:id/status | No in current implementation | Update listing state to active/inactive/sold          |

#### Listing creation flow

- validates crop, wasteType, quantity, unit, location, price
- stores listing in MemStorage or DB-backed storage
- used by farmer dashboard to manage supply inventory

### Company Routes

| Method | Endpoint               | Auth Required                | Purpose                           |
| ------ | ---------------------- | ---------------------------- | --------------------------------- |
| POST   | /api/company/products  | No in current implementation | Add a company product             |
| GET    | /api/company/products  | No in current implementation | Fetch a company’s product catalog |
| POST   | /api/company/orders    | No in current implementation | Create a company order            |
| POST   | /api/offers            | No in current implementation | Create an offer for a listing     |
| PATCH  | /api/offers/:id/status | No in current implementation | Accept or reject offer            |

#### Offer lifecycle behavior

- offer creation is allowed only if the listing exists and is active
- offer status defaults to pending
- once an offer is accepted, the listing is set to sold and other pending offers for that listing are rejected

### AI Engine Endpoints

| Method | Endpoint      | Auth Required | Purpose                                                |
| ------ | ------------- | ------------- | ------------------------------------------------------ |
| POST   | /api/ai/price | No            | Return pricing bounds and rationale for a crop listing |
| POST   | /api/ai/match | No            | Return compatibility score, reasons, and summary       |

#### /api/ai/price

Request fields:

- crop
- quantity
- location
- quality

Response structure:

```json
{
  "recommendedPrice": 29,
  "priceRange": {
    "min": 27,
    "max": 31
  },
  "reason": "Short explanation"
}
```

#### /api/ai/match

Request example:

```json
{
  "listing": {
    "crop": "rice",
    "quantity": 120,
    "quality": "standard",
    "location": "Punjab"
  },
  "company": {
    "name": "Agrolynk Buyer",
    "requiredCrop": "rice",
    "requiredQuantity": 120,
    "requiredQuality": "standard"
  }
}
```

Expected result:

- matchScore
- reasons[]
- summary

The prompt is designed to evaluate:

1. crop compatibility
2. quantity compatibility
3. quality compatibility
4. location fit if available

### Protected Routes & Middleware

The middleware layer is implemented in server/middleware/auth.ts.

#### requireAuth

- Extracts JWT from Authorization: Bearer <token>
- Verifies using JWT_SECRET
- populates req.user with userId and role
- returns 401 on missing/invalid token

#### requireRole

- checks the authenticated req.user
- accepts a list of allowed roles such as ["farmer", "company"]
- returns 403 if access is denied

### Implemented-but-Not-Enforced Note

At the time of audit, these middleware utilities are present but not wired into most route handlers. That means the app behaves like a functional demo with laid-out security primitives, but not yet a fully locked-down production API.

---

## 6) End-to-End User Workflows

### Farmer Journey

#### Step 1: Account registration

- User lands on the home page and chooses role selection
- User registers as farmer with name, email, password
- Backend hashes the password and creates a user record
- A JWT is returned and stored in localStorage via the AuthContext

#### Step 2: Farmer dashboard access

- Auth token is decoded client-side
- User is redirected to /farmer/options or /farmer/dashboard flows depending on app state
- Farmer can create listings and see received offers

#### Step 3: Market insight and pricing discovery

- Farmer visits the sell section
- Inputs include crop, location, quantity, and quality
- The app sends a GET request to /api/farmer/sell for market context
- The app sends a POST request to /api/ai/price for a model-based pricing recommendation

#### Step 4: AI price recommendation response

- Gemini returns JSON containing:
  - recommendedPrice
  - priceRange
  - reason
- The response is sanitized to strip markdown/code fences
- The frontend displays price guidance to help the farmer determine listing price

#### Step 5: Listing creation

- Farmer submits crop waste listing with fields like:
  - crop
  - wasteType
  - quantity
  - unit
  - location
  - price
- Backend validates and stores the listing
- Listing appears in My Listings within the farmer dashboard

#### Step 6: Offer handling

- Companies browse or query for supply
- When a company makes an offer on a listing, it posts to /api/offers
- Farmer can view offers and accept or reject them in dashboard flow
- When accepted, the listing status changes to sold and other pending offers are rejected automatically

### Company Journey

#### Step 1: Company registration

- User signs up with role = company
- Redirected to company workflow after auth token is stored

#### Step 2: Product / sourcing discovery

- Company can browse available product catalogs and market needs
- Company can create products and orders
- Buyer can query listing opportunities or request AI-based matching

#### Step 3: AI match analysis

- Customer selects crop, quantity, and grade quality
- Frontend posts to /api/ai/match with listing and company requirement objects
- Gemini evaluates crop compatibility, quality fit, quantity fit, and location fit
- Response includes matchScore, reasons[], and summary

#### Step 4: Offer creation

- If the company sees a viable listing, it submits an offer with:
  - listingId
  - companyId
  - offeredPrice
  - optional message
- Offer is stored as pending and tied to the listing

#### Step 5: Acceptance workflow

- Farmer reviews offer and accepts or rejects it
- Accepted offers mark the listing as sold
- Offer status transitions drive the negotiation logic in the UI

#### Step 6: Orders and procurement tracking

- Company orders can be created through /api/company/orders
- These represent the buying-side workflow and are tracked via company order records

---

## 7) Security, Resilience & Standout Features

### Security

The codebase includes a credible baseline security setup:

- Helmet for HTTP security headers
- CORS enabled for cross-origin requests
- express-rate-limit baseline API throttling
- JWT-based auth with bearer token verification
- password hashing via bcryptjs
- Zod validation on request payloads and query params
- structured error handling in the Express layer

### Resilience & Reliability

Important resilience patterns in the app:

- Dual storage strategy: PostgreSQL + in-memory fallback
- graceful degradation when DATABASE_URL is absent or invalid
- AI response sanitization before JSON parsing
- safe fallback behavior in auth and database code paths
- use of input sanitization and parse checks before business operations

### Standout Product Features

1. AI-powered price discovery
   - helps farmers set realistic listing prices
   - reduces emotional or information-poor pricing decisions

2. AI matching engine
   - enhances buyer procurement decisions
   - provides explainable compatibility scoring instead of opaque recommendations

3. Role-based buyer/seller workflows
   - simplification of complex agri-commerce into clear escalations

4. Multi-language UI
   - regional accessibility and broader adoption in Indian agriculture contexts

5. Dark mode + responsive UI
   - usability for varied device environments and low-light operation

6. Marketplace-based B2B logic
   - supports direct trade, negotiation, and transaction state tracking

### Product Storytelling Strengths

AgroLynk is memorable because it is not just a generic listing app. It is a direct supply network with embedded intelligence:

- an agricultural problem with obvious social and economic value
- a direct farmer-company market match problem
- AI used as a decision aide rather than just a demo gimmick
- a simple MVP that is easy to explain in under 2 minutes

---

## 8) Product Audit Summary

### What Works Well

- Clear value proposition grounded in real agricultural waste disposal and revenue loss
- Useful role-based interface for farmers and companies
- AI pricing and compatibility use cases are directly relevant to product value
- Strong UX for a hackathon demo, particularly in market discovery and negotiation flows
- Good backend structure and modular route design

### What Needs Attention for Production Readiness

- Middleware enforcement should be wired into all protected routes
- More explicit authorization checks are needed around farmer/company endpoints
- Error handling should be tightened around AI failures and invalid model output
- The product could benefit from real user ownership, listing moderation, pagination, and analytics
- Production-grade DB migrations and seed data are needed for sustained deployment

### Best Pitch Framing

"AgroLynk is an AI-powered agri-marketplace that converts crop waste from a disposal problem into a revenue opportunity. We help farmers sell byproducts more fairly and help companies source input supply more reliably."

---

## 9) Recommended Hackathon Pitch Narrative

### 30-Second Elevator Pitch

AgroLynk is an AI-powered marketplace that connects farmers with agricultural companies to monetize crop waste and byproducts. Farmers can list surplus material, get AI-assisted price recommendations, and receive offers directly, while companies can discover supply, evaluate compatibility, and buy more efficiently. We turn agricultural waste from a loss into a revenue stream.

### 1-Minute Story Arc

- Farmers burn or dump waste because they lack buyers and pricing transparency
- Companies struggle to find reliable local supply and quality matches
- AgroLynk creates a marketplace with AI-generated pricing and matching intelligence
- The result: higher farm income, lower waste, and more efficient industrial procurement

### Demo Script

"Today, a farmer can register, enter crop and waste details, and get an AI-generated price estimate before listing. Once the listing is live, companies can review the supply and request a compatibility match. The platform scores a match, explains why it is a good fit, and the company can make an offer. The farmer receives the offer and accepts or rejects it. This creates a transparent, efficient, and AI-enabled agricultural supply chain."

---

## 10) Final Assessment

AgroLynk is a compelling hackathon concept with strong product clarity, clear problem framing, and a realistic agricultural use case. The codebase demonstrates a workable MVP architecture, meaningful AI integration, and role-based user flows that are easy to pitch and demo.

It is strongest as:

- an AI-enabled agricultural supply marketplace
- a direct B2B intermediary between farmer-sourced biomass and industrial buyers
- a demo-friendly platform with understandable user stories and measurable value

The strongest pitch angle is not just "marketplace" but "AI + trust + direct commerce for agricultural waste." That framing makes the product feel grounded, impactful, and innovative.
