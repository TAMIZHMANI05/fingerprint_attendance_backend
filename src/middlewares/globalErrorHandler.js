module.exports = (err, _req, res, _next) => {
    res.status(err.statusCode).json(err);
};
