const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    }),
    name: Joi.string().required().messages({
        'any.required': 'Name is required'
    }),
    role: Joi.string().valid('admin', 'teacher', 'student').default('student'),

    // Student-specific fields
    studentId: Joi.when('role', {
        is: 'student',
        then: Joi.string().uppercase().required(),
        otherwise: Joi.forbidden()
    }),
    department: Joi.when('role', {
        is: 'student',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    }),
    year: Joi.when('role', {
        is: 'student',
        then: Joi.number().integer().min(1).max(4).required(),
        otherwise: Joi.forbidden()
    }),
    section: Joi.when('role', {
        is: 'student',
        then: Joi.string().uppercase(),
        otherwise: Joi.forbidden()
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

module.exports = {
    registerSchema,
    loginSchema
};

