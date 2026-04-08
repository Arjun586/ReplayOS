// Middleware to authenticate users using HttpOnly cookies instead of Bearer headers
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies?.jwt_token;

    if (!token) {
        res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('jwt_token');
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};