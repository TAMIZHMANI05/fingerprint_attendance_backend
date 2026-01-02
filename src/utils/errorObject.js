const responseMessage = require('../constants/responseMessage');
const config = require('../configs/config');
const EApplicationEnvironment = require('../constants/application');
const logger = require('./logger');

module.exports = (err, req, statusCode = 500) => {
    const errorObj = {
        success: false,
        statusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl
        },
        message: err instanceof Error ? err.message || responseMessage.SOMETHING_WENT_WRONG : responseMessage.SOMETHING_WENT_WRONG,
        data: null,
        trace: err instanceof Error ? { error: err.stack } : null
    };

    logger.error(`CONTROLLER_ERROR`, { meta: errorObj });

    //Production check
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete errorObj.request.ip;
        delete errorObj.trace;
    }

    return errorObj;
};
