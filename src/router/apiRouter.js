const express = require('express');

const apiController = require('../controller/apiController');
const authRouter = require('../modules/auth/auth.router');

const router = express.Router();

// Health check routes
router.route('/self').get(apiController.self);
router.route('/health').get(apiController.health);

// Auth routes
router.use('/auth', authRouter);

module.exports = router;

