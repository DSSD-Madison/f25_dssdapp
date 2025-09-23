import rateLimit from 'express-rate-limit';

export const applicationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { 
    error: 'Too many requests, please try again later (like in a min).', 
    errorType: 'RATE_LIMIT_EXCEEDED' 
  }
});