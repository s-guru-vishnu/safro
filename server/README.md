# 🚗 Safro – Smart Ride Checking & Safety Monitoring Backend

Production-ready Node.js backend for the Safro ride-sharing application with real-time tracking, safety monitoring, and Railway deployment support.

## ⚡ Tech Stack

- **Runtime:** Node.js (≥18)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT + bcrypt
- **Real-time:** Socket.io
- **Security:** Helmet, CORS, Rate Limiting
- **Deployment:** Railway

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── User.js                # User schema (rider/driver/admin)
│   │   ├── Driver.js              # Driver profile with GeoJSON location
│   │   ├── Ride.js                # Ride lifecycle & OTP
│   │   └── Payment.js             # Payment records
│   ├── controllers/
│   │   ├── authController.js      # Register, login, profile
│   │   ├── rideController.js      # Book, accept, start, complete, cancel
│   │   ├── driverController.js    # Location, availability, stats
│   │   └── paymentController.js   # Process payment, history
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── rideRoutes.js
│   │   ├── driverRoutes.js
│   │   └── paymentRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   ├── roleMiddleware.js      # Role-based access control
│   │   └── errorHandler.js        # Global error handler
│   ├── services/
│   │   └── driverMatchingService.js  # GeoJSON nearest-driver matching
│   ├── socket/
│   │   └── socketHandler.js       # Real-time event handling
│   └── app.js                     # Express app configuration
├── server.js                      # Entry point
├── .env.example                   # Environment variable template
├── package.json
├── railway.json                   # Railway deployment config
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Setup

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your values
#    - Add your MongoDB connection string
#    - Set a secure JWT secret

# 5. Start development server
npm run dev

# 6. (Production) Start server
npm start
```

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/safro` |
| `JWT_SECRET` | JWT signing secret | `your_super_secure_secret_key` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:5173,http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your_google_client_id` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `your_google_client_secret` |

## 🌐 MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user (Database Access → Add New Database User)
4. Whitelist your IP (Network Access → Add IP Address → `0.0.0.0/0` for Railway)
5. Get connection string (Clusters → Connect → Connect your application)
6. Set `MONGO_URI` in your `.env` file

## 🚀 Railway Deployment

1. Push your code to GitHub
2. Go to [Railway](https://railway.app) and create a new project
3. Select **Deploy from GitHub repo**
4. Add environment variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a secure random string
   - `NODE_ENV` = `production`
5. Railway will auto-detect `railway.json` and deploy
6. Your API will be live at the generated Railway URL

## 📡 API Documentation

### Auth Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/profile` | Get user profile | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |

### Ride Routes

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/api/rides/book` | Book a new ride | ✅ | Rider |
| PUT | `/api/rides/accept/:id` | Accept a ride | ✅ | Driver |
| PUT | `/api/rides/start/:id` | Start ride (OTP) | ✅ | Driver |
| PUT | `/api/rides/complete/:id` | Complete a ride | ✅ | Any |
| PUT | `/api/rides/cancel/:id` | Cancel a ride | ✅ | Any |
| GET | `/api/rides/history` | Get ride history | ✅ | Any |

### Driver Routes

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| PUT | `/api/drivers/location` | Update location | ✅ | Driver |
| GET | `/api/drivers/available` | Get nearby drivers | ✅ | Any |

### Payment Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/pay` | Process payment | ✅ |
| GET | `/api/payments/history` | Get payment history | ✅ |

## 🧪 Sample API Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+919876543210",
    "role": "rider"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Book Ride
```bash
curl -X POST http://localhost:5000/api/rides/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pickupLocation": {
      "address": "MG Road, Bangalore",
      "coordinates": { "type": "Point", "coordinates": [77.6065, 12.9716] }
    },
    "dropLocation": {
      "address": "Whitefield, Bangalore",
      "coordinates": { "type": "Point", "coordinates": [77.7500, 12.9698] }
    },
    "vehicleType": "sedan"
  }'
```

### Get Profile
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

## ⚡ Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRoom` | Client → Server | Join role-based room |
| `joinRide` | Client → Server | Join ride-specific room |
| `updateDriverLocation` | Client → Server | Send live driver location |
| `newRideRequest` | Server → Client | New ride available |
| `rideAccepted` | Server → Client | Ride accepted by driver |
| `rideStarted` | Server → Client | Ride started |
| `rideCompleted` | Server → Client | Ride completed |
| `rideCancelled` | Server → Client | Ride cancelled |
| `driverLocationUpdate` | Server → Client | Driver location update |
| `sosAlert` | Both | Emergency SOS alert |

## 📄 License

ISC
