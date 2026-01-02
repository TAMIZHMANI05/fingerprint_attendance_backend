const errorObject = require('./errorObject');

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
module.exports = (nextFunc, err, req, statusCode = 500) => {
    const errorObj = errorObject(err, req, statusCode);
    return nextFunc(errorObj);
};
