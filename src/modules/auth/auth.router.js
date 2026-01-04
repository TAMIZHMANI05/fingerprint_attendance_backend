const express = require('express');
const { createTeacher, createStudent, login, getProfile } = require('./auth.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);

// Admin-only: Create teachers
router.post('/create-teacher', verifyToken, requireRole(['admin']), createTeacher);

// Teacher-only: Create students
router.post('/create-student', verifyToken, requireRole(['teacher']), createStudent);

module.exports = router;

