/**
 * Socket.IO Event Emitter Utility
 * Provides functions to emit real-time attendance events
 */

let io = null;

/**
 * Initialize Socket.IO instance
 * @param {SocketIO.Server} socketIO - Socket.IO server instance
 */
const initializeSocket = (socketIO) => {
    io = socketIO;
};

/**
 * Get Socket.IO instance
 * @returns {SocketIO.Server}
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

/**
 * Emit attendance event to all connected clients (kiosk display)
 * @param {Object} data - Attendance event data
 */
const emitAttendanceEvent = (data) => {
    try {
        const io = getIO();

        // Emit to all clients (kiosk display)
        io.emit('attendance:event', data);
        console.log('✓ Real-time attendance event emitted:', {
            studentId: data.student?.studentId,
            action: data.action,
            session: data.session
        });
    } catch (error) {
        console.error('Socket emission error:', error.message);
    }
};

/**
 * Emit attendance rejection event (kiosk display)
 * @param {Object} data - Rejection data
 */
const emitAttendanceRejection = (data) => {
    try {
        const io = getIO();

        // Emit to all clients (kiosk display)
        io.emit('attendance:event', data);

        console.log('✓ Real-time rejection event emitted:', {
            studentId: data.student?.studentId,
            reason: data.reason
        });
    } catch (error) {
        console.error('Socket emission error:', error.message);
    }
};

/**
 * Emit manual attendance entry event (kiosk display)
 * @param {Object} data - Manual entry data
 */
const emitManualEntry = (data) => {
    try {
        const io = getIO();

        // Emit to all clients (kiosk display)
        io.emit('attendance:event', data);

        console.log('✓ Manual entry event emitted:', {
            studentId: data.studentId,
            action: data.action,
            session: data.session
        });
    } catch (error) {
        console.error('Socket emission error:', error.message);
    }
};

module.exports = {
    initializeSocket,
    getIO,
    emitAttendanceEvent,
    emitAttendanceRejection,
    emitManualEntry
};

