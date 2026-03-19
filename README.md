# Safro – Smart Ride-Sharing & Safety Monitoring

Safro is a premium, production-ready ride-sharing platform designed with a focus on **Smart Negotiation**, **User Safety**, and **Seamless Payments**. It provides a complete ecosystem for riders and drivers with real-time tracking, AI-powered fare predictions, and multi-channel notifications.

---

## ✨ Core Features

### 🟢 For Riders
- **Smart Negotiation**: Propose your fare and negotiate in real-time with nearby drivers.
- **Flexible Payments**: Pay via Wallet, Cash, or Online (Razorpay).
- **Live Tracking**: Monitor your driver's location and trip progress in real-time.
- **Safety First**: Integrated SOS emergency alerts and ride monitoring.
- **Targeted Cashback**: Earn rewards on your rides based on trip value.

### 🔵 For Drivers
- **Dynamic Earning**: Accept ride requests and counter-offer fares.
- **Geolocation Filtering**: View available rides within a 10km radius of your current location.
- **Real-time Dashboard**: Manage active trips and track your total earnings.
- **Easy Payouts**: Instant balance updates and secure transaction history.

### 🧠 Intelligent Backend
- **AI Fare Prediction**: Suggested fares based on distance, time, and historical data (via Gemini AI).
- **Multi-channel Notifications**: Automated Email and WhatsApp alerts for booking, assignment, and completion.
- **Real-time Sync**: Low-latency updates using Socket.IO for every ride state change.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Vanilla CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React + React Icons
- **Real-time**: Socket.IO Client
- **State Management**: React Context API

### Backend (Server)
- **Runtime**: Node.js (≥18)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Real-time**: Socket.IO
- **AI**: Google Gemini API
- **Payments**: Razorpay Node SDK
- **Notifications**: Nodemailer + Twilio

---

## 📁 Project Structure

```text
Safro/
├── client/                # React Frontend (Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Rider & Driver page views
│   │   ├── services/      # API & Socket integration
│   │   └── context/       # Auth & Global state
├── server/                # Node.js Backend (Express)
│   ├── src/
│   │   ├── models/        # Mongoose Schemas (User, Ride, Driver, etc.)
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API Endpoints
│   │   ├── socket/        # WebSocket event handlers
│   │   └── services/      # AI, Notifications, & Business services
└── n8n/                   # Workflow automation configurations
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: ≥18.x
- **MongoDB**: Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **API Keys**: Razorpay, Google Gemini, and optionally Twilio/SendGrid.

### 2. Installation

Clone the repository and install dependencies for both components:

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 3. Environment Setup

Create `.env` files in both directories based on the provided examples.

**Server (`server/.env`):**
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
```

**Client (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_key_id
```

### 4. Running the Project

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Your app will be available at `http://localhost:5173`.

---

## 🛡️ Safety & Security
- **JWT Authentication**: Secure user sessions with role-based access control.
- **OTP Verification**: Multi-factor verification for trip starts.
- **Fraud Detection**: Basic monitoring for suspicious ride patterns.
- **SOS Integration**: Real-time emergency broadcast for drivers and riders.

## 📄 License
This project is licensed under the **ISC License**.

---
*Built with ❤️ by the Safro Team*
