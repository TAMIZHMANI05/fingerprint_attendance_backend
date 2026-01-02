const httpResponse = require('../utils/httpResponse');
const responseMessage = require('../constants/responseMessage');
const httpError = require('../utils/httpError');
const quicker = require('../utils/quicker');

module.exports = {
    self: (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },
    health: async (req, res, next) => {
        try {
            const healthData = {
                systemHealth: quicker.getSystemHealth(),
                applicationHealth: quicker.getApplicationHealth(),
                dbHealth: await quicker.getDBHealth(),
                timestamp: Date.now()
            };
            httpResponse(req, res, 200, responseMessage.SUCCESS, healthData);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
};
