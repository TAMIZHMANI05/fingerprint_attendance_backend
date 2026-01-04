const express = require('express');
const path = require('path');
const router = require('./router/apiRouter');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const responseMessage = require('./constants/responseMessage');
const httpError = require('./utils/httpError');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./configs/config');
const { initializeSocket } = require('./utils/socketEmitter');

const app = express();

// Json Middleware
app.use(express.json());

// CORS Middleware
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        origin: config.CLIENT_URL,
        credentials: true
    })
);

// Security Middleware
app.use(helmet());

// Static Files Middleware
app.use(express.static(path.join(__dirname, '../', 'public')));

// API Routes
app.use('/api/v1', router);

// 404 Middleware
app.use((req, _res, next) => {
    try {
        throw new Error(responseMessage.NOTFOUND('Route'));
    } catch (error) {
        httpError(next, error, req, 404);
    }
});

// Global Error Handler Middleware
app.use(globalErrorHandler);

// Socket.IO setup function (simplified for kiosk)
const setupSocketIO = (io) => {
    // Authenticate kiosk using API key
    io.use((socket, next) => {
        const apiKey = socket.handshake.headers['x-api-key'];
        
        if (apiKey === require('./configs/config').KIOSK_API_KEY) {
            console.log('✓ Kiosk authenticated via Socket.IO');
            next();
        } else {
            console.log('✗ Unauthorized Socket.IO connection attempt');
            next(new Error('Invalid API key'));
        }
    });
    // Initialize socket emitter utility
    initializeSocket(io);

    // Store io instance for use in controllers
    app.set('io', io);

    io.on('connection', (socket) => {
        console.log(`✓ Kiosk display connected: ${socket.id}`);

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log(`✗ Kiosk display disconnected: ${socket.id}`);
        });
    });
};

module.exports = { app, setupSocketIO };

