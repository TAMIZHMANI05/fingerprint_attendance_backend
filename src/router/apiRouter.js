const express = require('express');

const apiController = require('../controller/apiController');
const authRouter = require('../modules/auth/auth.router');
const attendanceRouter = require('../modules/attendance-event/attendance.router');
const deviceRouter = require('../modules/device/device.router');

const router = express.Router();

// Health check routes
router.route('/self').get(apiController.self);
router.route('/health').get(apiController.health);

// Auth routes
router.use('/auth', authRouter);

// Attendance routes
router.use('/attendance', attendanceRouter);

// Device routes
router.use('/devices', deviceRouter);

module.exports = router;

