const express = require('express');
const { processAttendance, manualEntry, getEvents, getAttendanceReport } = require('./attendance.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth');

const router = express.Router();

// Process attendance (simulate fingerprint scan for testing)
// In production, this would be called by MQTT handler
router.post('/process', processAttendance);

// Manual attendance entry (admin only)
router.post('/manual', verifyToken, requireRole(['admin']), manualEntry);

// Get attendance events with filters (teachers/admins see all, students see only their own)
router.get('/events', verifyToken, getEvents);

// Universal attendance report endpoint
// Examples:
//   /report?studentId=CS2024001 (today for student)
//   /report?studentId=CS2024001&startDate=2026-01-01&endDate=2026-01-31 (date range for student)
//   /report?groupBy=class (class-wise report for today)
//   /report?groupBy=class&date=2026-01-04 (class-wise for specific date)
//   /report?date=2026-01-04&department=CS&year=2 (daily with filters)
//   /report (default: today's daily report)
router.get('/report', verifyToken, getAttendanceReport);

module.exports = router;

