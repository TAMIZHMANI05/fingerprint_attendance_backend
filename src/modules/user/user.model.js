const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        // Common fields for all roles
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false // Don't return password in queries by default
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        role: {
            type: String,
            enum: ['admin', 'teacher', 'student'],
            default: 'student',
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },

        // Student-specific fields (required only if role is 'student')
        studentId: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true
        },
        department: {
            type: String,
            trim: true
        },
        year: {
            type: Number,
            min: 1,
            max: 4
        },
        section: {
            type: String,
            trim: true,
            uppercase: true
        },
        fingerprintId: {
            type: Number,
            default: null,
            sparse: true
        },
        deviceId: {
            type: String,
            default: null
        },
        enrolledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ department: 1, year: 1, section: 1 }); // For class queries

const User = mongoose.model('User', userSchema);

module.exports = User;

