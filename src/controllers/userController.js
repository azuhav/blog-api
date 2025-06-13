import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { generatePasswordHash } from '../middleware/authMiddleware.js';

const secret = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;
        const admin = process.env.ADMIN_USERNAME;

        if (username !== admin) {
            return res.status(400).json({ message: 'Can\'t register this user' });
        }

        const passwordHash = await generatePasswordHash(password);
        const user = await new User({ username, email, passwordHash }).save();

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message || "An unknown error occurred"
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ _id: user._id, email }, secret, { expiresIn: '1h' });

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000
        });

        res.status(200).json({
            isAuthenticated: true,
            message: "Authentication Successful"
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message || "An unknown error occurred"
        });
    }
};

export const logoutUser = (req, res) => {
    res.clearCookie('jwt').json({
        isAuthenticated: false,
        message: "Logout Successful"
    });
};

export const checkAuthStatus = (req, res) => {
    const token = req.cookies?.jwt;
    if (!token) return res.json({ isAuthenticated: false });

    try {
        jwt.verify(token, secret);
        res.status(200).json({ isAuthenticated: true });
    } catch (error) {
        res.status(401).json({
            isAuthenticated: false,
            error: error.message || "An unknown error occurred"
        });
    }
};
