import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const secret = process.env.JWT_SECRET;

export async function generatePasswordHash(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export function authenticateToken(req, res, next) {
    const token = req.cookies?.jwt;

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
}
