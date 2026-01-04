const express = require('express');
const {
    createTeacher,
    createStudent,
    login,
    getProfile,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent,
    getTeachers,
    getTeacher,
    updateTeacher,
    deleteTeacher
} = require('./auth.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);

// Teacher Management (Admin Only)
router.post('/teachers', verifyToken, requireRole(['admin']), createTeacher);
router.get('/teachers', verifyToken, requireRole(['admin']), getTeachers);
router.get('/teachers/:id', verifyToken, requireRole(['admin']), getTeacher);
router.put('/teachers/:id', verifyToken, requireRole(['admin']), updateTeacher);
router.delete('/teachers/:id', verifyToken, requireRole(['admin']), deleteTeacher);

// Student Management (Teacher/Admin)
router.post('/students', verifyToken, requireRole(['teacher', 'admin']), createStudent);
router.get('/students', verifyToken, requireRole(['teacher', 'admin']), getStudents);
router.get('/students/:id', verifyToken, requireRole(['teacher', 'admin']), getStudent);
router.put('/students/:id', verifyToken, requireRole(['teacher', 'admin']), updateStudent);
router.delete('/students/:id', verifyToken, requireRole(['teacher', 'admin']), deleteStudent);

module.exports = router;

