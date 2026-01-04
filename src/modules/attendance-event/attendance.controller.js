const dayjs = require('dayjs');
const AttendanceEvent = require('./attendance-event.model');
const User = require('../user/user.model');
const { processAttendanceEvent, createManualEntry } = require('./attendance.service');
const httpResponse = require('../../utils/httpResponse');
const httpError = require('../../utils/httpError');

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

        if (result.success) {
            return httpResponse(req, res, 201, result.message, result);
        } else {
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
 * Get today's attendance for a student
 * GET /attendance/today/:studentId
 */
const getTodayAttendance = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        // Role-based access control: students can only see their own attendance
        if (req.user.role === 'student' && req.user.studentId !== studentId.toUpperCase()) {
            return httpError(next, new Error('Access denied: You can only view your own attendance'), req, 403);
        }

        const today = dayjs().format('YYYY-MM-DD');

        const events = await AttendanceEvent.find({
            studentId: studentId.toUpperCase(),
            date: today
        }).sort({ timestamp: 1 });

        // Group by session
        const morning = events.filter((e) => e.session === 'morning');
        const afternoon = events.filter((e) => e.session === 'afternoon');

        httpResponse(req, res, 200, "Today's attendance retrieved", {
            date: today,
            morning: {
                events: morning,
                hasIN: morning.some((e) => e.action === 'IN'),
                hasOUT: morning.some((e) => e.action === 'OUT'),
                complete: morning.some((e) => e.action === 'IN') && morning.some((e) => e.action === 'OUT')
            },
            afternoon: {
                events: afternoon,
                hasIN: afternoon.some((e) => e.action === 'IN'),
                hasOUT: afternoon.some((e) => e.action === 'OUT'),
                complete: afternoon.some((e) => e.action === 'IN') && afternoon.some((e) => e.action === 'OUT')
            }
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

/**
 * Get daily attendance for a date
 * GET /attendance/daily/:date
 * Returns attendance status for all students
 */
const getDailyAttendance = async (req, res, next) => {
    try {
        const { date } = req.params;

        const events = await AttendanceEvent.find({ date }).sort({ timestamp: 1 });

        // Group by student
        const studentMap = {};

        events.forEach((event) => {
            if (!studentMap[event.studentId]) {
                studentMap[event.studentId] = {
                    studentId: event.studentId,
                    morning: { IN: null, OUT: null },
                    afternoon: { IN: null, OUT: null }
                };
            }

            if (event.session === 'morning') {
                studentMap[event.studentId].morning[event.action] = event.timestamp;
            } else if (event.session === 'afternoon') {
                studentMap[event.studentId].afternoon[event.action] = event.timestamp;
            }
        });

        // Calculate attendance status
        const attendance = Object.values(studentMap).map((student) => ({
            ...student,
            morningPresent: !!(student.morning.IN && student.morning.OUT),
            afternoonPresent: !!(student.afternoon.IN && student.afternoon.OUT),
            present: !!(student.morning.IN && student.morning.OUT && student.afternoon.IN && student.afternoon.OUT)
        }));

        httpResponse(req, res, 200, 'Daily attendance retrieved', {
            date,
            attendance,
            totalStudents: attendance.length,
            presentCount: attendance.filter((s) => s.present).length
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

module.exports = {
    processAttendance,
    manualEntry,
    getEvents,
    getTodayAttendance,
    getDailyAttendance
};

