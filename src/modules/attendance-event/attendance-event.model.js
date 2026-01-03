const mongoose = require('mongoose');

const attendanceEventSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: [true, 'Student ID is required'],
            uppercase: true,
            trim: true
        },
        fingerprintId: {
            type: Number,
            required: [true, 'Fingerprint ID is required']
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        },
        date: {
            type: String, // Format: YYYY-MM-DD
            required: true
        },
        session: {
            type: String,
            enum: ['morning', 'afternoon', null],
            default: null
        },
        action: {
            type: String,
            enum: ['IN', 'OUT', null],
            default: null
        },
        deviceId: {
            type: String,
            required: [true, 'Device ID is required']
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false } // Only track creation, never update
    }
);

// Critical indexes for performance
// Most common query: Get events for a student on a specific date
attendanceEventSchema.index({ studentId: 1, date: 1 });
// Query by timestamp for time-range queries
attendanceEventSchema.index({ timestamp: -1, studentId: 1 });

const AttendanceEvent = mongoose.model('AttendanceEvent', attendanceEventSchema);

module.exports = AttendanceEvent;

