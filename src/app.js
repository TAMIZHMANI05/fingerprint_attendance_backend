const express = require('express');
const path = require('path');
const router = require('./route/apiRouter');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const responseMessage = require('./constants/responseMessage');
const httpError = require('./utils/httpError');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./configs/config');

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

module.exports = app;
