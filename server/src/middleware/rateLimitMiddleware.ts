import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: 'Too many register attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
