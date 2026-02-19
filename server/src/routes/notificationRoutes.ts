import { Router } from 'express';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.js';
const router = Router();

router.use(apiRateLimiter);

// TODO: Add notification routes here

export default router;