# Cloth Rental App

A full-stack, premium web application where users can rent designer clothes for special occasions instead of buying expensive outfits. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and features a modern, responsive Glassmorphic UI.

## Project Overview

**Users can:**
- Browse clothing items by category, size, price, and date availability.
- Check availability for specific dates with real-time calendar validation.
- Book outfits for a defined rental period.
- View booking history and initiate return requests.
- Manage their profile and account details securely.

**Admins can:**
- Add, edit, and delete clothing inventory with persistent Cloudinary image uploads.
- Toggle item availability dynamically.
- Track all user bookings, handle return requests, and mark items as returned.
- Approve or reject user accounts and manage user roles.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Vanilla CSS (Glassmorphism) |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT |
| Password Security | bcrypt |
| Image Upload | Cloudinary API + Multer |

## Project Structure

```text
cloth-rental/
|- client/
|  |- src/
|  |  |- components/
|  |  |- context/ (Auth, Toast Notifications)
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

## Production Deployment

This project is production-ready and configured to run seamlessly on PaaS providers like **Render** or **Heroku**. Because image uploads are handled via the **Cloudinary API**, you do not need persistent disk storage for your backend.

### Environment Variables

You must configure the following in your `server/.env` file (or your hosting dashboard):

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend.com
CORS_ORIGINS=https://your-frontend.com,http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Setup and Installation

1. Install dependencies for both client and server from the root directory:
```bash
npm run install:all
```

2. Start the development environment (runs both client and server concurrently):
```bash
npm run dev
```

*Frontend default URL: http://localhost:5173*  
*Backend default URL: http://localhost:5000*

## Implemented Features

- User registration, login, and secure JWT authentication.
- Premium, responsive Glassmorphic UI with global Toast notifications.
- Catalog browsing with advanced multi-filter search (size, price, availability, dates).
- Intelligent booking system with date-overlap prevention.
- User dashboard for booking history and return initialization.
- Admin dashboard for complete inventory and user lifecycle management.
- Persistent image uploads using the Cloudinary API.

## Optional Future Features

- Online payments (Razorpay/Stripe)
- Email/SMS notifications
- Ratings and reviews
- Wishlist
- Admin analytics dashboard
- AI outfit recommendations
