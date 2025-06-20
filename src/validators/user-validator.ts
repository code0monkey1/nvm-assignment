import { checkSchema } from 'express-validator';

export default checkSchema({
    email: {
        errorMessage: 'email is missing',
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: 'Email should be valid',
        },
    },
    password: {
        errorMessage: 'password is missing',
        notEmpty: true,
        trim: true,
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password must be at least 8 characters long',
        },
    },
    lastName: {
        errorMessage: 'lastName is missing',
        trim: true,
        notEmpty: true,
    },
    firstName: {
        errorMessage: 'firstName is missing',
        trim: true,
        notEmpty: true,
    },
    role: {
        errorMessage: 'Role is required!',
        notEmpty: true,
        trim: true,
        isIn: {
            options: [['manager', 'admin', 'customer']],
            errorMessage: 'Invalid User Role',
        },
    },
});
