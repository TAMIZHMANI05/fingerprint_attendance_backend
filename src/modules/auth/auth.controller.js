const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../configs/config');
const httpResponse = require('../../utils/httpResponse');
const httpError = require('../../utils/httpError');
const { registerSchema, loginSchema } = require('./auth.validation');

// Create teacher (admin only)
const createTeacher = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return httpError(next, new Error('Email, password, and name are required'), req, 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return httpError(next, new Error('Email already registered'), req, 409);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create teacher
        const teacher = await User.create({
            email,
            password: hashedPassword,
            name,
            role: 'teacher'
        });

        // Remove password from response
        const teacherResponse = teacher.toObject();
        delete teacherResponse.password;

        httpResponse(req, res, 201, 'Teacher created successfully', {
            teacher: teacherResponse
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Create student (teacher only)
const createStudent = async (req, res, next) => {
    try {
        const { email, password, name, studentId, department, year, section } = req.body;

        // Validate required fields for students
        if (!email || !password || !name || !studentId || !department || !year || !section) {
            return httpError(next, new Error('Email, password, name, studentId, department, year, and section are required'), req, 400);
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return httpError(next, new Error('Email already registered'), req, 409);
        }

        // Check if studentId already exists
        const existingStudent = await User.findOne({ studentId });
        if (existingStudent) {
            return httpError(next, new Error('Student ID already exists'), req, 409);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create student
        const student = await User.create({
            email,
            password: hashedPassword,
            name,
            role: 'student',
            studentId,
            department,
            year,
            section
        });

        // Remove password from response
        const studentResponse = student.toObject();
        delete studentResponse.password;

        httpResponse(req, res, 201, 'Student created successfully', {
            student: studentResponse
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Login user
const login = async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return httpError(next, new Error(error.details[0].message), req, 400);
        }

        // Find user by email (include password field)
        const user = await User.findOne({ email: value.email }).select('+password');
        if (!user) {
            return httpError(next, new Error('Invalid email or password'), req, 401);
        }

        // Check if user is active
        if (!user.isActive) {
            return httpError(next, new Error('Account is deactivated'), req, 403);
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(value.password, user.password);
        if (!isPasswordValid) {
            return httpError(next, new Error('Invalid email or password'), req, 401);
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                studentId: user.studentId || null
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        httpResponse(req, res, 200, 'Login successful', {
            user: userResponse,
            token
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Get current user profile
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return httpError(next, new Error('User not found'), req, 404);
        }

        httpResponse(req, res, 200, 'Profile retrieved successfully', { user });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// ========== STUDENT CRUD (Teacher Only) ==========

// Get all students (teachers see their class, admins see all)
const getStudents = async (req, res, next) => {
    try {
        const { department, year, section, search, limit = 50, skip = 0 } = req.query;

        const query = { role: 'student' };

        // Teachers can only see students from their assigned classes (optional future feature)
        // For now, teachers see all students, admins see all
        if (department) query.department = department;
        if (year) query.year = Number(year);
        if (section) query.section = section;

        // Search by name or studentId
        if (search) {
            query.$or = [{ name: { $regex: search, $options: 'i' } }, { studentId: { $regex: search, $options: 'i' } }];
        }

        const students = await User.find(query).select('-password').limit(Number(limit)).skip(Number(skip)).lean();

        const total = await User.countDocuments(query);

        httpResponse(req, res, 200, 'Students retrieved successfully', {
            students,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Get single student by ID
const getStudent = async (req, res, next) => {
    try {
        const { id } = req.params;

        const student = await User.findOne({ _id: id, role: 'student' }).select('-password');
        if (!student) {
            return httpError(next, new Error('Student not found'), req, 404);
        }

        httpResponse(req, res, 200, 'Student retrieved successfully', { student });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Update student (teacher only)
const updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, department, year, section, fingerprintId, deviceId } = req.body;

        const student = await User.findOne({ _id: id, role: 'student' });
        if (!student) {
            return httpError(next, new Error('Student not found'), req, 404);
        }

        // Check if email is being changed and if it already exists
        if (email && email !== student.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return httpError(next, new Error('Email already in use'), req, 409);
            }
            student.email = email;
        }

        // Update fields
        if (name) student.name = name;
        if (department) student.department = department;
        if (year) student.year = year;
        if (section) student.section = section;
        if (fingerprintId !== undefined) student.fingerprintId = fingerprintId;
        if (deviceId !== undefined) student.deviceId = deviceId;

        await student.save();

        const studentResponse = student.toObject();
        delete studentResponse.password;

        httpResponse(req, res, 200, 'Student updated successfully', { student: studentResponse });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Delete student (teacher only)
const deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;

        const student = await User.findOneAndDelete({ _id: id, role: 'student' });
        if (!student) {
            return httpError(next, new Error('Student not found'), req, 404);
        }

        httpResponse(req, res, 200, 'Student deleted successfully', { studentId: student.studentId });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// ========== TEACHER CRUD (Admin Only) ==========

// Get all teachers (admin only)
const getTeachers = async (req, res, next) => {
    try {
        const { search, limit = 50, skip = 0 } = req.query;

        const query = { role: 'teacher' };

        // Search by name or email
        if (search) {
            query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        }

        const teachers = await User.find(query).select('-password').limit(Number(limit)).skip(Number(skip)).lean();

        const total = await User.countDocuments(query);

        httpResponse(req, res, 200, 'Teachers retrieved successfully', {
            teachers,
            total,
            limit: Number(limit),
            skip: Number(skip)
        });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Get single teacher by ID (admin only)
const getTeacher = async (req, res, next) => {
    try {
        const { id } = req.params;

        const teacher = await User.findOne({ _id: id, role: 'teacher' }).select('-password');
        if (!teacher) {
            return httpError(next, new Error('Teacher not found'), req, 404);
        }

        httpResponse(req, res, 200, 'Teacher retrieved successfully', { teacher });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Update teacher (admin only)
const updateTeacher = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const teacher = await User.findOne({ _id: id, role: 'teacher' });
        if (!teacher) {
            return httpError(next, new Error('Teacher not found'), req, 404);
        }

        // Check if email is being changed and if it already exists
        if (email && email !== teacher.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return httpError(next, new Error('Email already in use'), req, 409);
            }
            teacher.email = email;
        }

        // Update fields
        if (name) teacher.name = name;

        await teacher.save();

        const teacherResponse = teacher.toObject();
        delete teacherResponse.password;

        httpResponse(req, res, 200, 'Teacher updated successfully', { teacher: teacherResponse });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

// Delete teacher (admin only)
const deleteTeacher = async (req, res, next) => {
    try {
        const { id } = req.params;

        const teacher = await User.findOneAndDelete({ _id: id, role: 'teacher' });
        if (!teacher) {
            return httpError(next, new Error('Teacher not found'), req, 404);
        }

        httpResponse(req, res, 200, 'Teacher deleted successfully', { email: teacher.email });
    } catch (err) {
        httpError(next, err, req, 500);
    }
};

module.exports = {
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
};

