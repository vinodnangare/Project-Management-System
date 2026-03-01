import { Router } from 'express';
import { 
  register, 
  signIn, 
  getProfile,
  updateProfile,
  deleteEmployeeAccount, 
  uploadProfileImage,
  refreshToken,
  logout,
  logoutAll,
  validateToken,
  blacklistCurrentToken,
  getSessions
} from '../controllers/authController.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// Public endpoints
router.post('/register', registerRateLimiter, register);
router.post('/login', loginRateLimiter, signIn);
router.post('/refresh', refreshToken);

// Token validation endpoints (can be used to detect immediate logout on token change)
router.post('/validate', validateToken);

// Protected endpoints (require valid access token)
router.get('/profile', verifyJwt, getProfile);
router.patch('/profile', verifyJwt, updateProfile);
router.post('/profile/image', verifyJwt, upload.single('image'), uploadProfileImage);
router.delete('/employees/:employeeId', verifyJwt, deleteEmployeeAccount);
router.post('/logout', verifyJwt, logout);
router.post('/logout-all', verifyJwt, logoutAll);
router.post('/blacklist-token', verifyJwt, blacklistCurrentToken);
router.get('/sessions', verifyJwt, getSessions);

export default router;
