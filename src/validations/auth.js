import { body } from 'express-validator';

export const registrationValidator = [
    body('username').isLength({ min: 5 }),
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),

]