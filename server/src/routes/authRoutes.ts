import { Router } from 'express';
import { register, signIn, deleteEmployeeAccount, uploadProfileImage } from '../controllers/authController.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.post('/register', registerRateLimiter, register);

router.post('/login', loginRateLimiter, signIn);

router.post('/profile/image', verifyJwt, upload.single('image'), uploadProfileImage);

router.delete('/employees/:employeeId', verifyJwt, deleteEmployeeAccount);

export default router;
