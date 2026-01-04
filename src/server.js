const http = require('http');
const { Server } = require('socket.io');
const { app, setupSocketIO } = require('./app');
const config = require('./configs/config');
const logger = require('./utils/logger');
const { initRateLimiter } = require('./configs/rateLimiter');
const databaseService = require('./configs/database');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Setup Socket.IO handlers
setupSocketIO(io);

(async () => {
    try {
        initRateLimiter();
        logger.info('RATE_LIMITER_INITIALIZED');

        const connection = await databaseService.connect();
        logger.info(`DATABASE_CONNECTION`, {
            meta: {
                CONNECTION_NAME: connection.name
            }
        });

        // Start server
        server.listen(config.PORT);

        logger.info(`APPLICATION_STARTED`, {
            meta: {
                PORT: config.PORT,
                SERVER_URL: config.SERVER_URL
            }
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        logger.error(`APPLICATION_ERROR`, { meta: err });
        server.close((error) => {
            if (error) {
                // eslint-disable-next-line no-console
                logger.error(`APPLICATION_ERROR`, { meta: error });
                process.exit(1);
            }
        });
    }
})();

