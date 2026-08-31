# AgroLynk 🌾

AgroLynk is a B2B agricultural tech platform built for SIH 2026 that connects farmers directly with industrial buyers to sell crop residue and byproducts. By leveraging AI for smart matching and price discovery, we eliminate the information gap that forces farmers to sell cheap or burn their waste.

### 🎯 Problem & Solution
*   **The Problem:** Every year, 500 million tonnes of crop residue is burned in India because farmers lack buyers, price information, and industry reach.
*   **The Solution:** An intelligent B2B marketplace featuring AI-powered price discovery and location-aware matching to facilitate direct trade. 

### ✨ Key Features
*   **Role-Based Portals:** Dedicated, secure workflows for Farmers to create listings and Companies to search and make offers.
*   **AI Price Discovery:** Instant NLP-based price recommendations and ranges generated when a farmer lists waste.
*   **Smart Match Explanations:** AI-generated insights explaining why a specific listing is a high-value match for a company's search.
*   **Market Trends:** Interactive Recharts-based dashboards tracking 6 months of historical data and Mandi reference prices.

### 🛠️ Tech Stack
*   **Frontend:** React, Tailwind CSS, TypeScript
*   **Backend:** Node.js, Express.js, Claude API integration
*   **Database:** PostgreSQL hosted on Neon, connected via Drizzle ORM
*   **Security:** JSON Web Tokens (JWT), role-based middleware, Helmet, and express-rate-limit

### 🚀 Getting Started

1.  Clone the repository and install dependencies using `npm install` (use `--legacy-peer-deps` if Vite conflicts occur).
2.  Duplicate `.env.example` to `.env` and configure your `DATABASE_URL`, `JWT_SECRET`, and Claude API keys.
3.  Run the database migrations and seed the demo data using `npm run db:seed`.
4.  Start the development server using `npm run dev`.