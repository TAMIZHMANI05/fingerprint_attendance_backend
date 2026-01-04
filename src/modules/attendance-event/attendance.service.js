const dayjs = require('dayjs');
const AttendanceEvent = require('./attendance-event.model');
const User = require('../user/user.model');
/**
 * Session time windows (inclusive)
 */
const SESSION_WINDOWS = {
    morning: {
        start: '09:00',
        end: '12:30'
    },
    afternoon: {
        start: '13:30',
        end: '16:30'
    }
};

/**
 * Determine session based on current time
 * @param {Date} timestamp - Timestamp to check
 * @returns {string|null} - 'morning', 'afternoon', or null if outside windows
 */
const determineSession = (timestamp) => {
    const time = dayjs(timestamp);
    const timeStr = time.format('HH:mm');

    // Check morning session (09:00 - 12:30)
    if (timeStr >= SESSION_WINDOWS.morning.start && timeStr <= SESSION_WINDOWS.morning.end) {
        return 'morning';
    }

    // Check afternoon session (13:30 - 16:30)
    if (timeStr >= SESSION_WINDOWS.afternoon.start && timeStr <= SESSION_WINDOWS.afternoon.end) {
        return 'afternoon';
    }

    return null;
};

/**
 * Determine next action (IN or OUT) based on previous events
 * @param {string} studentId
 * @param {string} date - Format: YYYY-MM-DD
 * @param {string} session - 'morning' or 'afternoon'
 * @returns {Promise<string|null>} - 'IN', 'OUT', or null if session completed
 */
const determineAction = async (studentId, date, session) => {
    // Get all events for this student, date, and session
    const events = await AttendanceEvent.find({
        studentId,
        date,
        session
    }).sort({ timestamp: 1 });

    // No events yet - next action is IN
    if (events.length === 0) {
        return 'IN';
    }

    // Get last action
    const lastAction = events[events.length - 1].action;

    // If last action was IN, next is OUT
    if (lastAction === 'IN') {
        return 'OUT';
    }

    // If last action was OUT, session is completed
    if (lastAction === 'OUT') {
        return null; // Session already has IN and OUT
    }

    return 'IN'; // Default to IN
};

/**
 * Check for duplicate scan (any scan within 5 minutes, regardless of action)
 * @param {string} studentId
 * @param {string} date
 * @param {string} session
 * @param {Date} currentTimestamp - Current scan timestamp
 * @returns {Promise<boolean>} - True if duplicate exists
 */
const isDuplicate = async (studentId, date, session, currentTimestamp) => {
    const fiveMinutesAgo = dayjs(currentTimestamp).subtract(5, 'minute').toDate();

    const recentEvent = await AttendanceEvent.findOne({
        studentId,
        date,
        session,
        timestamp: {
            $gte: fiveMinutesAgo,
            $lt: currentTimestamp // Must be before current scan
        }
    });

    return !!recentEvent;
};

/**
 * Process attendance event from fingerprint scan
 * @param {Object} params
 * @param {number} params.fingerprintId - Fingerprint ID from scanner
 * @param {string} params.deviceId - Device ID
 * @param {Date} params.timestamp - Scan timestamp (defaults to now)
 * @returns {Promise<Object>} - Event result with status and reason
 */
const processAttendanceEvent = async ({ fingerprintId, deviceId, timestamp = new Date() }) => {
    try {
        const scanTime = dayjs(timestamp);
        const date = scanTime.format('YYYY-MM-DD');

        // 1. Resolve student from fingerprintId
        const student = await User.findOne({
            fingerprintId,
            deviceId,
            role: 'student',
            isActive: true
        });

        if (!student) {
            // No matching student - don't write to DB
            return {
                success: false,
                reason: 'INVALID_STUDENT',
                message: 'Fingerprint not registered or inactive'
            };
        }

        // 2. Determine session
        const session = determineSession(timestamp);

        if (!session) {
            // Outside time window - don't write to DB
            return {
                success: false,
                reason: 'OUTSIDE_WINDOW',
                message: `Scan outside valid time windows (Morning: ${SESSION_WINDOWS.morning.start}-${SESSION_WINDOWS.morning.end}, Afternoon: ${SESSION_WINDOWS.afternoon.start}-${SESSION_WINDOWS.afternoon.end})`,
                student: {
                    studentId: student.studentId,
                    name: student.name
                }
            };
        }

        // 3. Determine action (IN or OUT)
        const action = await determineAction(student.studentId, date, session);

        if (!action) {
            // Session already completed (has both IN and OUT) - don't write to DB
            return {
                success: false,
                reason: 'SESSION_COMPLETED',
                message: `${session} session already completed`,
                student: {
                    studentId: student.studentId,
                    name: student.name
                },
                session
            };
        }

        // 4. Check for duplicate (any scan within 5 minutes)
        const duplicate = await isDuplicate(student.studentId, date, session, timestamp);

        if (duplicate) {
            // Duplicate scan - don't write to DB
            return {
                success: false,
                reason: 'DUPLICATE',
                message: `Duplicate scan detected (within 5 minutes)`,
                student: {
                    studentId: student.studentId,
                    name: student.name
                },
                session,
                action
            };
        }

        // 5. All validations passed - create event
        const event = await AttendanceEvent.create({
            studentId: student.studentId,
            fingerprintId,
            timestamp,
            date,
            session,
            action,
            deviceId
        });

        return {
            success: true,
            message: `${action} recorded for ${session} session`,
            student: {
                studentId: student.studentId,
                name: student.name,
                department: student.department,
                year: student.year,
                section: student.section
            },
            session,
            action,
            timestamp: scanTime.format('HH:mm'),
            event: event.toObject()
        };
    } catch (err) {
        console.error('Error processing attendance event:', err);
        throw err;
    }
};

/**
 * Manual attendance entry (for corrections/makeup)
 * @param {Object} params
 * @param {string} params.studentId
 * @param {string} params.action - 'IN' or 'OUT'
 * @param {string} params.session - 'morning' or 'afternoon'
 * @param {Date} params.timestamp
 * @param {string} params.deviceId
 * @returns {Promise<Object>} - Created event
 */
const createManualEntry = async ({ studentId, action, session, timestamp, deviceId }) => {
    const scanTime = dayjs(timestamp);
    const date = scanTime.format('YYYY-MM-DD');

    // Verify student exists
    const student = await User.findOne({ studentId, role: 'student' });
    if (!student) {
        throw new Error('Student not found');
    }

    // Create manual entry (bypasses most validations)
    const event = await AttendanceEvent.create({
        studentId,
        fingerprintId: student.fingerprintId || 0,
        timestamp,
        date,
        session,
        action,
        deviceId
    });

    return {
        success: true,
        message: `Manual ${action} entry created for ${session} session`,
        event: event.toObject()
    };
};

module.exports = {
    processAttendanceEvent,
    createManualEntry,
    determineSession,
    determineAction,
    SESSION_WINDOWS
};

