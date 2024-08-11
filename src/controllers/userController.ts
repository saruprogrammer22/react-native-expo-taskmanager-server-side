import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { IUser, ILogin, IUserUpdate } from '../types/type';

const SALT_ROUNDS = 10;
const JWT_KEY = process.env.JWT_SECRET as string;

// Admin: Get all users
const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const [results] = await pool.query<RowDataPacket[]>('SELECT * FROM `user-data`');
        return res.status(200).json({ status: true, result: results });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
};

// Admin: Delete user by ID
const deleteByIdUser = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ status: false, error: "User ID is required" });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>('DELETE FROM `user-data` WHERE `userId` = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, error: "User not found" });
        }

        return res.status(200).json({ status: true, message: "User deleted successfully" });
    } catch (error) {
        console.error('Query error:', error);
        return res.status(500).json({ status: false, error: "Database query error" });
    }
};



// User: Create a new user
export const createUser = async (req: Request, res: Response): Promise<Response> => {
    const { name, email, password } = req.body as IUser;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO `user-data` (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        return res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                name,
                email
            }
        });
    } catch (error) {
        console.error('User creation error:', error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// User: Get User By Id
const getUserById = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ status: false, error: "User ID is required" });
    }

    try {
        const [results] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM `user-data` WHERE `userId` = ?',
            [userId]
        );

        if (results.length === 0) {
            return res.status(404).json({ status: false, error: "User not found" });
        }

        return res.status(200).json({ status: true, result: results[0] });
    } catch (error) {
        console.error('Query error:', error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
};

const updateMyUserById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userId = req.params.userId;
        const { name, email } = req.body as IUserUpdate;

        // Input validation
        if (!userId || !name || !email) {
            return res.status(400).json({ status: false, error: 'Missing required fields' });
        }

        // Check if user exists
        const [existingUsers] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM `user-data` WHERE `userId` = ?',
            [userId]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({ status: false, error: 'User not found' });
        }

        // Update user data
        const [result] = await pool.execute<ResultSetHeader>(
            'UPDATE `user-data` SET `name` = ?, `email` = ? WHERE `userId` = ?',
            [name, email, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, error: 'Failed to update user' });
        }

        return res.status(200).json({ status: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// User: Delete the current user
const deleteMyCurrentUser = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ status: false, error: "User ID is required" });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM `user-data` WHERE `userId` = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, error: "User not found" });
        }

        return res.status(200).json({ status: true, message: "User deleted successfully" });
    } catch (error) {
        console.error('Query error:', error);
        return res.status(500).json({ status: false, error: "Database query error" });
    }
};

export const signInUser = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body as ILogin;

    // Basic validation for email and password
    if (!email || !password) {
        return res.status(400).json({
            status: false,
            error: 'Email and password are required.',
        });
    }

    try {
        // Query the user from the database using a parameterized query to prevent SQL injection
        const [rows]: [RowDataPacket[], any] = await pool.query(
            'SELECT * FROM `user-data` WHERE `email` = ?',
            [email]
        );

        if (rows.length === 0) {
            // If no user is found with the provided email
            return res.status(401).json({
                status: false,
                error: 'Invalid email or password.',
            });
        }

        const user = rows[0];

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // If the password does not match
            return res.status(401).json({
                status: false,
                error: 'Invalid email or password.',
            });
        }

        // Generate a JWT token
        const token = jwt.sign(
            {
                role: user.role,
                email: user.email,
                id: user.userId,
            },
            JWT_KEY,
            { expiresIn: '1d' }
        );

        // Set the JWT token in an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
        });

        // Respond with the success message and the token
        return res.status(200).json({
            status: true,
            message: 'Login successful.',
            token, // Include the token in the response body
            userId: user.userId,
        });
    } catch (error) {
        // Log the error for debugging
        console.error('Error during sign-in:', error);

        // Respond with a generic server error message
        return res.status(500).json({
            status: false,
            error: 'Internal server error.',
        });
    }
};


const signOutUser = (req: Request, res: Response): Response => {
    try {
        // Clear the JWT token cookie
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
        });

        // Respond with a successful logout message
        return res.status(200).json({
            status: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error('Logout error:', error);

        // Respond with a generic server error message
        return res.status(500).json({
            status: false,
            error: "Internal server error occurred during logout.",
        });
    }
};


export default {
    createUser,
    getAllUsers,
    deleteByIdUser,
    getUserById,
    updateMyUserById,
    signInUser,
    deleteMyCurrentUser,
    signOutUser,
};
