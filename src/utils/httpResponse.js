const config = require('../configs/config');
const EApplicationEnvironment = require('../constants/application');
const logger = require('./logger');

module.exports = (req, res, statusCode, message, data) => {
    const response = {
        success: true,
        statusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl
        },
        message,
        data
    };

    // Log
    logger.info(`CONTROLLER_RESPONSE`, { meta: response });

    //Production check
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete response.request.ip;
    }

    res.status(statusCode).json(response);
};
