import express from 'express';
import authenticateToken, { validateToken } from '../../middleware/auth';
import taskController from '../controllers/taskController';

const router = express.Router();

// user
router.post("/", validateToken, authenticateToken, taskController.createTask)
router.get("/:taskId", validateToken, authenticateToken, taskController.getTaskById)
router.get("/", validateToken, authenticateToken, taskController.getAllTasks)
router.delete("/:taskId", validateToken, authenticateToken, taskController.deleteTaskById)


export default router