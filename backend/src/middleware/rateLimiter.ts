import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter - applies to all endpoints
 * Allows 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    suggestions: [
      'You have exceeded the rate limit of 100 requests per 15 minutes',
      'Please wait a few minutes before making more requests',
      'If you need higher limits, consider using the API more efficiently'
    ]
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health' || req.path === '/api'
});

/**
 * Stricter rate limiter for resource-intensive endpoints
 * Allows 20 requests per 15 minutes per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests to this resource-intensive endpoint, please try again later.',
    suggestions: [
      'You have exceeded the rate limit of 20 requests per 15 minutes for this endpoint',
      'This endpoint requires significant server resources',
      'Please wait a few minutes before making more requests'
    ]
  },
  standardHeaders: true,
  legacyHeaders: false
});

