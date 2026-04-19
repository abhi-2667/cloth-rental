# Cloth Rental App

A full-stack platform where users can rent clothes for special occasions instead of buying expensive outfits. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Project Overview

Users can:
- Browse clothing items by category, size, price, and date availability
- Check availability for specific dates
- Book outfits for a defined rental period
- View booking history

Admins can:
- Add, edit, and delete clothing inventory
- Toggle item availability
- Track all bookings and returns
- Mark items as returned

## Detailed Documentation

For full academic-style project documentation, see [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT |
| Password Security | bcrypt |
| Image Upload | Multer (local uploads) |

## Project Structure

```text
cloth-rental/
|- client/
|  |- src/
|  |  |- components/
|  |  |- context/
|  |  |- pages/
|  |  |- utils/
|  |  |- App.jsx
|  |- package.json
|- server/
|  |- controllers/
|  |- middleware/
|  |- models/
|  |- routes/
|  |- index.js
|  |- package.json
|- README.md
```

## Database Schema

### Users

```js
{
  name: String,
  email: String, // unique
  password: String, // hashed
  role: String // "user" | "admin"
}
```

### Clothes

```js
{
  title: String,
  description: String,
  category: String,
  size: String,
  pricePerDay: Number,
  availability: Boolean,
  imageUrl: String
}
```

### Bookings

```js
{
  userId: ObjectId,
  clothId: ObjectId,
  startDate: Date,
  endDate: Date,
  totalPrice: Number,
  status: String // "booked" | "returned"
}
```

## API Endpoints

### Auth - /api/auth
- POST /register
- POST /login
- POST /login/request-link
- POST /login/verify-link

### Clothes - /api/clothes
- GET /
- GET /:id
- POST / (admin)
- PUT /:id (admin)
- DELETE /:id (admin)

### Bookings - /api/bookings
- POST / (user)
- GET /my (user)
- GET / (admin)
- PUT /:id/return (admin)

### Users - /api/users
- GET /profile (user)
- PUT /profile (user)
- GET /notifications (user)
- PUT /notifications/:id/read (user)
- GET / (admin)
- PUT /:id/role (admin)
- PUT /:id/approval (admin)

## Inventory Availability Policy

- `availability` is a global admin switch for each cloth item.
- If `availability` is `false`, the item is hidden as unavailable for all date ranges.
- If `availability` is `true`, booking still uses date-overlap blocking, so overlapping rentals are rejected.
- Effective availability = global flag + no overlapping `booked` records.

## API Examples

### Register user (approval pending)

Request

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123"
}
```

Response

```json
{
  "message": "Account created. Waiting for admin approval.",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "approvalStatus": "pending"
  }
}
```

### Login

Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@cloth-rental.local",
  "password": "Admin1234!"
}
```

Response

```json
{
  "user": {
    "id": "...",
    "name": "Studio Admin",
    "email": "admin@cloth-rental.local",
    "role": "admin",
    "approvalStatus": "approved"
  },
  "token": "<jwt>"
}
```

### Create booking

Request

```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "clothId": "665f2f6e6cc1ac7a8426b002",
  "startDate": "2026-04-25",
  "endDate": "2026-04-28"
}
```

Response

```json
{
  "_id": "...",
  "userId": "...",
  "clothId": "...",
  "startDate": "2026-04-25T00:00:00.000Z",
  "endDate": "2026-04-28T00:00:00.000Z",
  "totalPrice": 540,
  "status": "booked"
}
```

### Approve user (admin)

Request

```http
PUT /api/users/<userId>/approval
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "approvalStatus": "approved"
}
```

Response

```json
{
  "id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "approvalStatus": "approved"
}
```

## Business Logic

### Availability overlap check

A booking is rejected if any existing booked record overlaps the requested range:

```js
existingStart <= newEnd && existingEnd >= newStart
```

### Price calculation

```js
const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
const totalPrice = days * cloth.pricePerDay;
```

## Setup and Installation

### Quick start from project root

Install all dependencies:

```bash
npm run install:all
```

Run backend and frontend together:

```bash
npm run dev

## Production Deployment (No Cloud Storage)

This project is production-ready with local file uploads (no Cloudinary/S3) when deployed on a server with persistent disk for the `server/uploads` directory.

### 1. Configure Environment

Copy and fill env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Important:
- Set a strong `JWT_SECRET`
- Set `MONGO_URI`
- Set `CLIENT_URL` and `CORS_ORIGINS` to your frontend domain
- Keep `VITE_API_BASE_URL=/api` if frontend and backend are behind the same domain/reverse proxy

### 2. Install and Build

```bash
npm run install:all
npm run build
```

### 3. Start Backend API

```bash
npm run start
```

API readiness endpoints:
- `GET /api/health`
- `GET /api/ready`

### 4. Uploads Directory

Uploads are stored on local disk under `server/uploads`. Ensure this directory is persisted in production.

### 5. Reverse Proxy

Use Nginx or similar to:
- serve frontend static app
- proxy `/api` and `/uploads` to backend (port 5000)

### 6. Security Defaults Already Included

- Helmet
- CORS allowlist
- Global + auth rate limiting
- JWT auth and role-based middleware

### 7. Recommended Runtime

Run backend under a process manager (e.g. PM2 or systemd) for auto-restart and logs.
```

### Prerequisites
- Node.js v18+
- MongoDB local/Atlas

### Install backend

```bash
cd server
npm install
```

### Install frontend

```bash
cd ../client
npm install
```

### Environment variables

Create server/.env:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
```

### Run backend

```bash
cd server
npm run dev
```

### Run frontend

```bash
cd client
npm run dev
```

Frontend default URL: http://localhost:5173
Backend URL: http://localhost:5000

## Implemented Features

- User registration and login (JWT)
- Browse catalog with category, size, price, and date filters
- Booking with overlap prevention
- Booking history for users
- Admin booking management and return tracking
- Admin inventory management (add, edit, delete, availability toggle)

## Optional Future Features

- Online payments (Razorpay/Stripe)
- Email/SMS notifications
- Ratings and reviews
- Wishlist
- Admin analytics
- AI outfit recommendations
