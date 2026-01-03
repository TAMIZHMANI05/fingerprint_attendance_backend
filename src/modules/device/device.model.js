const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: [true, 'Device ID is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Device name is required'],
            trim: true
        },
        // Class assignment
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true
        },
        year: {
            type: Number,
            required: [true, 'Year is required'],
            min: 1,
            max: 4
        },
        section: {
            type: String,
            required: [true, 'Section is required'],
            trim: true,
            uppercase: true
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        lastSeen: {
            type: Date,
            default: null
        },
        maxFingerprints: {
            type: Number,
            default: 200, // R307 capacity
            min: 1
        },
        enrolledCount: {
            type: Number,
            default: 0,
            min: 0
        },
        model: {
            type: String,
            default: 'R307'
        },
        firmwareVersion: {
            type: String,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;

