import express from 'express';
import userController from '../controllers/userController';
import authenticateToken, { validateToken } from '../../middleware/auth';

const router = express.Router();
// admin
router.get("/v1/allUsers", userController.getAllUsers)
router.delete("/v1/:userId", authenticateToken, userController.deleteByIdUser)


// user
router.post("/", userController.createUser)
router.put("/:userId", validateToken, authenticateToken, validateToken, userController.updateMyUserById)
router.get("/:userId", authenticateToken, validateToken, userController.getUserById)
router.delete("/:userId", authenticateToken, validateToken, userController.deleteMyCurrentUser)

router.post("/sign-in", userController.signInUser)
router.post("/sign-out", validateToken, authenticateToken, validateToken, userController.signOutUser)
export default router