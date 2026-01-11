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
 * Emit attendance event to device-specific room (kiosk display)
 * @param {Object} data - Attendance event data (must include deviceId)
 */
const emitAttendanceEvent = (data) => {
    try {
        const io = getIO();

        if (!data.device) {
            console.error('✗ Cannot emit event: deviceId missing');
            return;
        }

        // Emit to device-specific room
        const roomName = `device:${data.device.deviceId}`;
        io.to(roomName).emit('attendance:event', data);
        console.log('✓ Real-time attendance event emitted:', {
            room: roomName,
            studentId: data.student?.studentId,
            action: data.action,
            session: data.session
        });
    } catch (error) {
        console.error('Socket emission error:', error.message);
    }
};

/**
 * Emit attendance rejection event to device-specific room (kiosk display)
 * @param {Object} data - Rejection data (must include deviceId)
 */
const emitAttendanceRejection = (data) => {
    try {
        const io = getIO();        

        if (!data.device) {
            console.error('✗ Cannot emit rejection: deviceId missing');
            return;
        }

        // Emit to device-specific room
        const roomName = `device:${data.device.deviceId}`;
        io.to(roomName).emit('attendance:event', data);

        console.log('✓ Real-time rejection event emitted:', {
            room: roomName,
            studentId: data.student?.studentId,
            reason: data.reason
        });
    } catch (error) {
        console.error('Socket emission error:', error.message);
    }
};

/**
 * Emit manual attendance entry event to device-specific room (kiosk display)
 * @param {Object} data - Manual entry data (must include deviceId)
 */
const emitManualEntry = (data) => {
    try {
        const io = getIO();

        if (!data.device.deviceId) {
            console.error('✗ Cannot emit manual entry: deviceId missing');
            return;
        }

        // Emit to device-specific room
        const roomName = `device:${data.device.deviceId}`;
        io.to(roomName).emit('attendance:event', data);

        console.log('✓ Manual entry event emitted:', {
            room: roomName,
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

