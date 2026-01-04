const dayjs = require('dayjs');
const AttendanceEvent = require('./attendance-event.model');
const { processAttendanceEvent, createManualEntry } = require('./attendance.service');
const { generateAttendanceReport } = require('./attendance.report');
const httpResponse = require('../../utils/httpResponse');
const httpError = require('../../utils/httpError');
const { emitAttendanceEvent, emitAttendanceRejection } = require('../../utils/socketEmitter');

/**
 * Process attendance (simulate fingerprint scan for testing)
 * POST /attendance/process
 * Body: { fingerprintId, deviceId, timestamp? }
 */
const processAttendance = async (req, res, next) => {
    try {
        const { fingerprintId, deviceId, timestamp } = req.body;

        if (!fingerprintId || !deviceId) {
            return httpError(next, new Error('fingerprintId and deviceId are required'), req, 400);
        }

        const result = await processAttendanceEvent({
            fingerprintId: Number(fingerprintId),
            deviceId,
            timestamp: timestamp ? new Date(timestamp) : new Date()
        });

        // Emit real-time event
        if (result.success) {
            emitAttendanceEvent(result);
            return httpResponse(req, res, 201, result.message, result);
        } else {
            emitAttendanceRejection(result);
            return httpResponse(req, res, 400, result.message, result);
        }
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

/**
 * Manual attendance entry (admin only)
 * POST /attendance/manual
 * Body: { studentId, action, session, timestamp, deviceId }
 */
const manualEntry = async (req, res, next) => {
    try {
        const { studentId, action, session, timestamp, deviceId } = req.body;

        if (!studentId || !action || !session || !timestamp || !deviceId) {
            return httpError(next, new Error('studentId, action, session, timestamp, and deviceId are required'), req, 400);
        }

        const result = await createManualEntry({
            studentId,
            action,
            session,
            timestamp: new Date(timestamp),
            deviceId
        });

        // Emit real-time manual entry event
        emitAttendanceEvent(result);

        httpResponse(req, res, 201, result.message, result);
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

/**
 * Get attendance events with filters
 * GET /attendance/events
 * Query params: studentId, date, session, startDate, endDate, limit, skip
 */
const getEvents = async (req, res, next) => {
    try {
        const { studentId, date, session, startDate, endDate, limit = 50, skip = 0 } = req.query;

        // Build query
        const query = {};

        // Role-based access control: students can only see their own events
        if (req.user.role === 'student') {
            query.studentId = req.user.studentId;
        } else if (studentId) {
            // Teachers and admins can filter by studentId
            query.studentId = studentId.toUpperCase();
        }

        if (date) query.date = date;
        if (session) query.session = session;

        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const events = await AttendanceEvent.find(query).sort({ timestamp: -1 }).limit(Number(limit)).skip(Number(skip));

        const total = await AttendanceEvent.countDocuments(query);

        httpResponse(req, res, 200, 'Events retrieved successfully', {
            events,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

/**
 * Universal attendance report endpoint
 * GET /attendance/report
 * Query params:
 *   - studentId: Get student report (with optional startDate, endDate, or date for single day)
 *   - groupBy=class: Get class-wise report (with optional date, defaults to today)
 *   - date: Get daily report (with optional department, year, section filters)
 *   - Default (no params): Today's daily report
 */
const getAttendanceReport = async (req, res, next) => {
    try {
        const { studentId, date, startDate, endDate, department, year, section, groupBy } = req.query;

        // Role-based access control
        if (req.user.role === 'student') {
            // Students can only see their own report
            if (!studentId || req.user.studentId !== studentId.toUpperCase()) {
                return httpError(next, new Error('Access denied: Students can only view their own attendance'), req, 403);
            }
        } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
            // Teachers/admins can see all reports
            // No restrictions
        }

        const report = await generateAttendanceReport(req.query);

        httpResponse(req, res, 200, 'Attendance report generated', report);
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

module.exports = {
    processAttendance,
    manualEntry,
    getEvents,
    getAttendanceReport
};

