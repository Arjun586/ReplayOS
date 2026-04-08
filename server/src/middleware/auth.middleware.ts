// server/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Hum Express ke default Request object ko extend kar rahe hain 
// taaki hum usme 'user' ka data attach kar sakein (TypeScript ke liye zaroori hai)
export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // 1. Client ke headers se 'Authorization' token nikalo
    const authHeader = req.headers.authorization;

    // 2. Check karo ki token exist karta hai aur 'Bearer ' se start hota hai
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        return;
    }

    // 3. "Bearer <token>" string se sirf token wala part alag karo
    const token = authHeader.split(' ')[1];

    try {
        // 4. Token ko verify karo
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        
        // 5. User ki ID aur Email request object mein daal do taaki controllers iska use kar sakein
        req.user = decoded; 
        
        // 6. Sab theek hai, ab request ko aage Controller ke paas bhej do
        next(); 
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};