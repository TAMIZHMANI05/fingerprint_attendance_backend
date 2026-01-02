const config = require('../configs/config');
const EApplicationEnvironment = require('../constants/application');
const { getRateLimiter } = require('../configs/rateLimiter');
const httpError = require('../utils/httpError');
const responseMessage = require('../constants/responseMessage');

module.exports = (req, _res, next) => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return next();
    }

    const rateLimiter = getRateLimiter();

    if (rateLimiter) {
        rateLimiter
            .consume(req.ip, 1)
            .then(() => {
                next();
            })
            .catch(() => {
                httpError(next, new Error(responseMessage.TOO_MANY_REQUESTS), req, 429);
            });
    } else {
        // ✅ Allow requests through if rate limiter isn't initialized yet
        next();
    }
};
