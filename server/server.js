require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const socketHandler = require('./src/socket/socketHandler');

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',')
            : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Make io accessible to controllers via app
app.set('io', io);

// Initialize socket handler
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n🚀 Safro Server running on port ${PORT}`);
        console.log(`📡 Socket.io ready`);
        console.log(`🔗 API: http://localhost:${PORT}/api`);
        console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
}).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    server.close(() => process.exit(1));
});
