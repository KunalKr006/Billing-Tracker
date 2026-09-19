# Billing Tracker

Billing Tracker is a MERN application for tracking client work, rates, payments, and monthly billing.

## Stack

- MongoDB with Mongoose for persistence
- Express API bootstrapped by `backend/src/server.js`
- React and Vite frontend in `frontend/`

## Run locally

1. Start MongoDB locally, or set `MONGODB_URI` to a MongoDB Atlas connection string.
2. Copy `backend/.env.example` to `backend/.env` and adjust the values if needed.
3. Install and start the API with `cd backend`, `npm install`, and `npm run dev`.
4. Start the frontend in another terminal with `cd frontend`, `npm install`, and `npm run dev`.

The frontend uses `VITE_API_URL`, defaulting to `http://localhost:8000`. To load the August 2026 demo data, run `npm run seed` from `backend` once MongoDB is available.

## Backend structure

```text
backend/
├── src/
│   ├── config/database.js
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── app.js
│   └── server.js
├── seed.js
├── .env
└── package.json
```