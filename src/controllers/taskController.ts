import { Request, Response } from 'express';
import pool from '../config/db';
import { ITask } from '../types/type';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Create a task
const createTask = async (req: Request, res: Response): Promise<Response> => {
    const { title, status, category } = req.body as ITask;

    if (!title || !status || !category) {
        return res.status(400).json({ status: false, error: "Missing required fields" });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO `task` (title, status, category) VALUES (?, ?, ?)',
            [title, status, category]
        );

        return res.status(201).json({
            status: true,
            result: {
                message: "Task created successfully",
            },
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
};

// Get all tasks
const getAllTasks = async (req: Request, res: Response): Promise<Response> => {
    try {
        const [result] = await pool.query<RowDataPacket[]>('SELECT * FROM `task`');

        // Check if result is not empty
        if (result.length === 0) {
            return res.status(404).json({ status: false, message: "No tasks found" });
        }

        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Unexpected error:', error);

        // Handle different types of errors more granularly
        if (error instanceof Error) {
            return res.status(500).json({ status: false, result: [], error: error.message });
        }

        return res.status(500).json({ status: false, error: "Internal server error" });
    }
};

// Get task by ID
const getTaskById = async (req: Request, res: Response): Promise<Response> => {
    const { taskId } = req.params;

    if (!taskId) {
        return res.status(400).json({ status: false, error: "Task ID is required" });
    }

    try {
        const [result] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM `task` WHERE taskId = ?',
            [taskId]
        );

        if (result.length === 0) {
            return res.status(404).json({ status: false, error: "Task not found" });
        }

        return res.status(200).json({ status: true, result: result[0] });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
};

// Delete task by ID
const deleteTaskById = async (req: Request, res: Response): Promise<Response> => {
    const { taskId } = req.params;

    if (!taskId) {
        return res.status(400).json({ status: false, error: "Task ID is required" });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM `task` WHERE `taskId` = ?',
            [taskId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, error: "Task not found" });
        }

        return res.status(200).json({ status: true, message: "Task deleted successfully" });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
};


export default {
    createTask,
    getAllTasks,
    getTaskById,
    deleteTaskById,
};
