# 🎉 CelebrateHub - Backend API

A full **Node.js + Express + MongoDB** REST API for the CelebrateHub event management platform.

---

## 📁 Folder Structure

```
celebratehub-backend/
├── src/
│   ├── config/
│   │   ├── db.js            ← MongoDB connection
│   │   └── seed.js          ← Demo data seeder
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── serviceController.js
│   │   ├── bookingController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js          ← JWT protect + requireRole
│   │   └── errorHandler.js  ← Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── bookingRoutes.js
│   │   └── userRoutes.js
│   └── server.js            ← Entry point
├── .env
└── package.json
```

---

## 🚀 Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Edit .env with your MongoDB URI and settings

# 3. Seed demo data
node src/config/seed.js

# 4. Start development server
npm run dev

# 5. Start production server
npm start
```

---

## 🔑 Environment Variables (.env)

| Variable        | Description                      |
|-----------------|----------------------------------|
| `PORT`          | Server port (default 5000)       |
| `MONGO_URI`     | MongoDB connection string        |
| `JWT_SECRET`    | Secret key for JWT signing       |
| `JWT_EXPIRES_IN`| Token expiry (e.g. 7d)          |
| `DEMO_OTP`      | Demo OTP (default 123456)        |

---

## 📡 API Endpoints

### Auth  `/api/auth`
| Method | Route             | Access  | Description            |
|--------|-------------------|---------|------------------------|
| POST   | `/send-otp`       | Public  | Request OTP            |
| POST   | `/register`       | Public  | Register new user      |
| POST   | `/login`          | Public  | Login with OTP         |
| PUT    | `/select-role`    | Private | Choose user/vendor     |
| GET    | `/me`             | Private | Get current user       |

### Services  `/api/services`
| Method | Route             | Access  | Description                    |
|--------|-------------------|---------|--------------------------------|
| GET    | `/`               | Public  | List all (search & filter)     |
| GET    | `/:id`            | Public  | Get single service             |
| GET    | `/vendor/mine`    | Vendor  | Get vendor's own services      |
| POST   | `/`               | Vendor  | Create new service             |
| PUT    | `/:id`            | Vendor  | Update service                 |
| DELETE | `/:id`            | Vendor  | Remove service                 |

### Bookings  `/api/bookings`
| Method | Route                  | Access  | Description                  |
|--------|------------------------|---------|------------------------------|
| POST   | `/`                    | User    | Create booking               |
| GET    | `/my`                  | User    | My bookings                  |
| DELETE | `/:id`                 | User    | Cancel booking               |
| PUT    | `/:id/pay`             | User    | Pay for booking              |
| PUT    | `/:id/rate`            | User    | Rate + review booking        |
| GET    | `/vendor/requests`     | Vendor  | View booking requests        |
| PUT    | `/:id/respond`         | Vendor  | Accept / reject booking      |

### Users  `/api/users`
| Method | Route                     | Access  | Description             |
|--------|---------------------------|---------|-------------------------|
| GET    | `/profile`                | Private | View profile            |
| PUT    | `/profile`                | Private | Update profile          |
| GET    | `/wishlist`               | User    | Get wishlist            |
| PUT    | `/wishlist/:serviceId`    | User    | Toggle wishlist         |
| GET    | `/vendor/stats`           | Vendor  | Dashboard stats         |

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <token>
```

Get token from `/api/auth/login` response.

---

## 🔍 Service Query Params

```
GET /api/services?search=catering&category=Catering&priceRange=mid&page=1&limit=20
```

- `search` — text search (name, location, owner, category)
- `category` — exact category match
- `priceRange` — `low` (<5000), `mid` (5000–20000), `high` (>20000)
- `page`, `limit` — pagination

---

## 🛠 Tech Stack

- **Node.js** + **Express** — REST API
- **MongoDB** + **Mongoose** — Database & ODM
- **JWT** — Authentication tokens
- **bcryptjs** — Password/OTP hashing
- **dotenv** — Environment config
- **cors** — Cross-origin requests
