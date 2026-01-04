const express = require('express');
const { processAttendance, manualEntry, getEvents, getTodayAttendance, getDailyAttendance } = require('./attendance.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth');

const router = express.Router();

// Process attendance (simulate fingerprint scan for testing)
// In production, this would be called by MQTT handler
router.post('/process', processAttendance);

// Manual attendance entry (admin only)
router.post('/manual', verifyToken, requireRole(['admin']), manualEntry);

// Get attendance events (teachers and admins can see all, students see only their own)
router.get('/events', verifyToken, getEvents);

// Get today's attendance for a student
router.get('/today/:studentId', verifyToken, getTodayAttendance);

// Get daily attendance report (teachers and admins only)
router.get('/daily/:date', verifyToken, requireRole(['teacher', 'admin']), getDailyAttendance);

module.exports = router;

