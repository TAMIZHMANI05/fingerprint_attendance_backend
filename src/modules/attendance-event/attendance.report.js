const AttendanceEvent = require('./attendance-event.model');
const User = require('../user/user.model');
const dayjs = require('dayjs');

/**
 * Universal attendance report generator
 * Handles student, class, and daily reports based on query parameters
 * @param {Object} query - Query parameters
 * @returns {Object} Report based on query type
 */
const generateAttendanceReport = async (query) => {
    const { studentId, date, startDate, endDate, department, year, section, groupBy } = query;

    // Determine report type based on query parameters
    if (studentId) {
        // STUDENT REPORT
        return await generateStudentReport(studentId, startDate || date, endDate || date);
    } else if (groupBy === 'class') {
        // CLASS-WISE REPORT
        return await generateClassReport(date || dayjs().format('YYYY-MM-DD'));
    } else {
        // DAILY REPORT (with optional filters)
        return await generateDailyReport(date || dayjs().format('YYYY-MM-DD'), { department, year, section });
    }
};

/**
 * Generate student attendance report
 */
const generateStudentReport = async (studentId, startDate, endDate) => {
    const student = await User.findOne({ studentId: studentId.toUpperCase(), role: 'student' }).lean();

    if (!student) {
        throw new Error('Student not found');
    }

    // Default to today if no dates provided
    if (!startDate && !endDate) {
        const today = dayjs().format('YYYY-MM-DD');
        startDate = today;
        endDate = today;
    }

    // Build query
    const query = { studentId: studentId.toUpperCase() };
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }

    // Get events
    const events = await AttendanceEvent.find(query).sort({ date: 1, timestamp: 1 }).lean();

    // Group by date
    const dateMap = {};
    events.forEach((event) => {
        if (!dateMap[event.date]) {
            dateMap[event.date] = { morning: { IN: null, OUT: null }, afternoon: { IN: null, OUT: null } };
        }
        if (event.session === 'morning') {
            dateMap[event.date].morning[event.action] = event.timestamp;
        } else if (event.session === 'afternoon') {
            dateMap[event.date].afternoon[event.action] = event.timestamp;
        }
    });

    // Calculate daily attendance
    const dailyAttendance = Object.entries(dateMap).map(([date, attendance]) => ({
        date,
        morning: {
            present: !!(attendance.morning.IN && attendance.morning.OUT),
            inTime: attendance.morning.IN,
            outTime: attendance.morning.OUT
        },
        afternoon: {
            present: !!(attendance.afternoon.IN && attendance.afternoon.OUT),
            inTime: attendance.afternoon.IN,
            outTime: attendance.afternoon.OUT
        },
        fullyPresent: !!(attendance.morning.IN && attendance.morning.OUT && attendance.afternoon.IN && attendance.afternoon.OUT)
    }));

    // Calculate statistics
    const start = dayjs(startDate || dailyAttendance[0]?.date);
    const end = dayjs(endDate || dailyAttendance[dailyAttendance.length - 1]?.date);
    const totalDays = end.diff(start, 'day') + 1;
    const fullyPresent = dailyAttendance.filter((d) => d.fullyPresent).length;

    return {
        type: 'student',
        student: {
            studentId: student.studentId,
            name: student.name,
            department: student.department,
            year: student.year,
            section: student.section
        },
        dateRange: { startDate, endDate, totalDays },
        summary: {
            totalDaysPresent: fullyPresent,
            morningPresent: dailyAttendance.filter((d) => d.morning.present).length,
            afternoonPresent: dailyAttendance.filter((d) => d.afternoon.present).length,
            attendancePercentage: totalDays > 0 ? ((fullyPresent / totalDays) * 100).toFixed(2) : 0
        },
        dailyAttendance
    };
};

/**
 * Generate daily report (all students for a date with optional filters)
 */
const generateDailyReport = async (date, filters = {}) => {
    // Build student query
    const studentQuery = { role: 'student' };
    if (filters.department) studentQuery.department = filters.department;
    if (filters.year) studentQuery.year = Number(filters.year);
    if (filters.section) studentQuery.section = filters.section;

    // Get students
    const students = await User.find(studentQuery).select('studentId name department year section').lean();
    const studentIds = students.map((s) => s.studentId);

    // Get events for filtered students
    const events = await AttendanceEvent.find({ date, studentId: { $in: studentIds } }).lean();

    // Build attendance map
    const attendanceMap = {};
    events.forEach((event) => {
        if (!attendanceMap[event.studentId]) {
            attendanceMap[event.studentId] = { morning: { IN: null, OUT: null }, afternoon: { IN: null, OUT: null } };
        }
        if (event.session === 'morning') {
            attendanceMap[event.studentId].morning[event.action] = event.timestamp;
        } else if (event.session === 'afternoon') {
            attendanceMap[event.studentId].afternoon[event.action] = event.timestamp;
        }
    });

    // Combine student data with attendance
    const report = students.map((student) => {
        const attendance = attendanceMap[student.studentId] || { morning: { IN: null, OUT: null }, afternoon: { IN: null, OUT: null } };
        return {
            studentId: student.studentId,
            name: student.name,
            department: student.department,
            year: student.year,
            section: student.section,
            morning: {
                present: !!(attendance.morning.IN && attendance.morning.OUT),
                inTime: attendance.morning.IN,
                outTime: attendance.morning.OUT
            },
            afternoon: {
                present: !!(attendance.afternoon.IN && attendance.afternoon.OUT),
                inTime: attendance.afternoon.IN,
                outTime: attendance.afternoon.OUT
            },
            fullyPresent: !!(attendance.morning.IN && attendance.morning.OUT && attendance.afternoon.IN && attendance.afternoon.OUT)
        };
    });

    // Calculate summary
    const summary = {
        totalStudents: report.length,
        fullyPresent: report.filter((s) => s.fullyPresent).length,
        morningPresent: report.filter((s) => s.morning.present).length,
        afternoonPresent: report.filter((s) => s.afternoon.present).length,
        absent: report.filter((s) => !s.morning.present && !s.afternoon.present).length,
        partialPresent: report.filter((s) => !s.fullyPresent && (s.morning.present || s.afternoon.present)).length
    };

    return {
        type: 'daily',
        date,
        filters,
        summary,
        students: report
    };
};

/**
 * Generate class-wise attendance report
 */
const generateClassReport = async (date) => {
    // Get all unique classes
    const classes = await User.aggregate([
        { $match: { role: 'student' } },
        {
            $group: {
                _id: { department: '$department', year: '$year', section: '$section' },
                totalStudents: { $sum: 1 }
            }
        },
        { $sort: { '_id.department': 1, '_id.year': 1, '_id.section': 1 } }
    ]);

    // Get attendance for each class
    const classReports = await Promise.all(
        classes.map(async (cls) => {
            const report = await generateDailyReport(date, {
                department: cls._id.department,
                year: cls._id.year,
                section: cls._id.section
            });

            return {
                class: `${cls._id.department} - Year ${cls._id.year} - Section ${cls._id.section}`,
                department: cls._id.department,
                year: cls._id.year,
                section: cls._id.section,
                ...report.summary
            };
        })
    );

    return {
        type: 'class',
        date,
        classes: classReports,
        overallSummary: {
            totalStudents: classReports.reduce((sum, c) => sum + c.totalStudents, 0),
            fullyPresent: classReports.reduce((sum, c) => sum + c.fullyPresent, 0),
            morningPresent: classReports.reduce((sum, c) => sum + c.morningPresent, 0),
            afternoonPresent: classReports.reduce((sum, c) => sum + c.afternoonPresent, 0)
        }
    };
};

module.exports = {
    generateAttendanceReport
};

