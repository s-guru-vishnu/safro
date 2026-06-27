const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const otpRoutes = require('./routes/otpRoutes');
const negotiationRoutes = require('./routes/negotiationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const mapRoutes = require('./routes/mapRoutes');
const locationRoutes = require('./routes/locationRoutes');
const splitFareRoutes = require('./routes/splitFareRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://safro.vercel.app",
  "https://safro-ride.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
}));
app.options("*", cors());

// 3. Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// 4 & 5 & 6. Body Parsing
// Webhook raw body parser MUST come before express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Passport Configuration ─────────────────────────────────────
require('./config/passport');
const passport = require('passport');
app.use(passport.initialize());

// ─── OAuth Diagnostics ─────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
console.log('🔑 GOOGLE OAUTH CONFIG:');
console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ MISSING');
console.log('   Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ MISSING');
console.log('   Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback' || '❌ NOT SET (using fallback)');
console.log('   Frontend URL:', 'https://safro-ride.vercel.app' || 'http://localhost:5173' || '❌ NOT SET (using fallback)');
console.log('══════════════════════════════════════════');
console.log('📋 GOOGLE CONSOLE MUST HAVE THIS REDIRECT URI:');
console.log('   →', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback');
console.log('══════════════════════════════════════════\n');

// ─── Rate Limiting ──────────────────────────────────────────────
const rootLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for development
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', rootLimiter);

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many payment requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/payment', paymentLimiter);

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/auth', otpRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/negotiation', negotiationRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/split-fare', splitFareRoutes);
app.use('/api/test/email', require('./routes/testEmailRoute'));
app.use('/api/test/email', require('./routes/testEmailRoute'));

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Backend is running",
        timestamp: new Date().toISOString()
    });
});

// ─── Root Route ─────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "Safro Backend API is running"
    });
});

// ─── 404 Handler ────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
