import { Router } from 'express';
import { register, signIn } from '../controllers/authController.js';

const router = Router();

// Employee registration (no admin registration via API)
router.post('/register', register);

// Admin/Employee login
router.post('/login', signIn);

export default router;
