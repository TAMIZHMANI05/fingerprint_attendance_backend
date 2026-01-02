const app = require('./app');
const config = require('./configs/config');
const logger = require('./utils/logger');
const { initRateLimiter } = require('./configs/rateLimiter');
const server = app.listen(config.PORT);
const databaseService = require('./configs/database');

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
