import express from 'express';
import authenticateToken, { validateToken } from '../../middleware/auth';
import taskController from '../controllers/taskController';

const router = express.Router();

// task
router.post("/", taskController.createTask)
router.get("/:taskId", taskController.getTaskById)
router.get("/", taskController.getAllTasks)
router.delete("/:taskId", taskController.deleteTaskById)


export default router