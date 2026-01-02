const { RateLimiterMemory } = require('rate-limiter-flexible');

let rateLimiter = null;

const DURATION = 60; // seconds
const MAX_REQUESTS = 10; // max requests per duration

const initRateLimiter = () => {
    rateLimiter = new RateLimiterMemory({
        points: MAX_REQUESTS,
        duration: DURATION
    });
};

const getRateLimiter = () => rateLimiter;

module.exports = { getRateLimiter, initRateLimiter };
