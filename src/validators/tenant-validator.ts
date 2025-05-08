import { checkSchema } from 'express-validator';

export default checkSchema({
    name: {
        errorMessage: 'tenant name is missing',
        notEmpty: true,
        trim: true,
        isLength: {
            options: { max: 100 },
        },
    },
    address: {
        errorMessage: 'tenant address is missing',
        notEmpty: true,
        trim: true,
        isLength: {
            options: { max: 255 },
        },
    },
});
