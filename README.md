# CollVerse Backend API

Production-quality REST API for the College Discovery Platform, built with **Node.js**, **Express.js**, **PostgreSQL (Neon DB)**, and **Prisma ORM**.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd Backend
npm install
```

### 2. Push database schema
```bash
npm run db:push
```

### 3. Seed the database
```bash
npm run db:seed
```

### 4. Start development server
```bash
npm run dev
```

Server runs at **http://localhost:5000**

---

## 📁 Project Structure

```
Backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.js             # Seed data (12 colleges + demo user)
│
├── src/
│   ├── config/
│   │   └── prisma.js       # Singleton Prisma client
│   ├── controllers/        # HTTP request/response handlers
│   │   ├── auth.controller.js
│   │   ├── college.controller.js
│   │   ├── saved.controller.js
│   │   └── review.controller.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js         # JWT authentication
│   │   ├── errorHandler.js # Global error handler
│   │   └── validate.js     # Input validation runner
│   ├── routes/             # Route definitions
│   │   ├── auth.routes.js
│   │   ├── college.routes.js
│   │   ├── saved.routes.js
│   │   └── review.routes.js
│   ├── services/           # Business logic layer
│   │   ├── auth.service.js
│   │   ├── college.service.js
│   │   ├── saved.service.js
│   │   └── review.service.js
│   ├── utils/
│   │   ├── jwt.js          # Token generation & verification
│   │   └── response.js     # Standardized JSON responses
│   ├── validators/         # express-validator rules
│   │   ├── auth.validator.js
│   │   └── review.validator.js
│   └── server.js           # Express app entry point
│
├── .env                    # Environment variables
└── package.json
```

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT token |
| GET | `/api/auth/profile` | ✅ | Get current user profile |

### Colleges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/colleges` | — | List colleges (paginated + filters) |
| GET | `/api/colleges/search` | — | Search colleges |
| GET | `/api/colleges/compare` | — | Compare colleges `?ids=slug1,slug2` |
| GET | `/api/colleges/:id` | — | Get single college by slug or ID |

**Query params for listing/search:**
- `page`, `limit` — pagination
- `search` — full-text search by name/city/state
- `state` — filter by state
- `type` — Government / Private / Deemed
- `minRating`, `minFees`, `maxFees` — filter by rating/fees
- `sort` — `ranking` | `rating` | `feesAsc` | `feesDesc` | `newest`

### Saved Colleges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/saved` | ✅ | Save a college `{ collegeId }` |
| GET | `/api/saved` | ✅ | List all saved colleges |
| DELETE | `/api/saved/:id` | ✅ | Remove a saved college |

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | ✅ | Submit a review |
| GET | `/api/reviews/:collegeId` | — | Get reviews for a college |

---

## 🧪 Demo Credentials

After seeding:
- **Email:** `demo@collverse.com`
- **Password:** `demo1234`

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

## 📊 Response Format

### Success
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### Error
```json
{
  "success": false,
  "message": "...",
  "errors": [{ "field": "email", "message": "..." }]
}
```
