import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../src/config/db';
import { RowDataPacket } from 'mysql2';

dotenv.config();

const JWT_KEY = process.env.JWT_SECRET as string;

// Define a custom type for the JWT payload
interface JwtPayloadWithUser extends jwt.JwtPayload {
    id: number;
    name: string;
    email: string;
}

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

// Middleware to authenticate the JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: false, error: 'Access token is missing or invalid' });
    }

    jwt.verify(token, JWT_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ status: false, error: 'Token is not valid' });
        }

        // Cast the decoded object to the custom JWT payload type
        req.user = decoded as JwtPayloadWithUser;
        next();
    });
};

// Middleware to validate the token and check if the user exists in the database
export const validateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if the Authorization header is present and formatted correctly
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: false, error: 'No token provided' });
        }

        // Extract the token from the header
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ status: false, error: 'No token provided' });
        }

        // Verify the token
        jwt.verify(token, JWT_KEY, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ status: false, error: 'Invalid token' });
            }

            // Ensure that the decoded token is an object with an 'id' property
            if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
                // Check if the user exists in the database
                const [user] = await pool.query<RowDataPacket[]>(
                    'SELECT * FROM `user-data` WHERE `userId` = ?',
                    [decoded.id]
                );

                if (user.length === 0) {
                    return res.status(401).json({ status: false, error: 'User not found' });
                }

                // Set the decoded user data on the request object
                req.user = decoded as JwtPayloadWithUser;
            } else {
                return res.status(401).json({ status: false, error: 'Invalid token format' });
            }

            next();
        });
    } catch (error) {
        console.error('Token validation error:', error);
        return res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

export default authenticateToken;