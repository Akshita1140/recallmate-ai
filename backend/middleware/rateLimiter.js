// Rate limiting middleware for the /analyze endpoint.
// This protects the Gemini API from being overwhelmed during the hackathon.
// We use express-rate-limit to cap each IP to 10 requests per minute.

const rateLimit = require('express-rate-limit');

const analyzeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per IP per window
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: {
    status: 'error',
    message: 'Too many analyze requests. Please slow down and try again shortly.'
  }
});

module.exports = analyzeRateLimiter;

