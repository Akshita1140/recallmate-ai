// Entry point for the RecallMate backend API.
// High-level architecture:
// - This file wires together infrastructure (Express app, middleware, routes).
// - Route files define URL endpoints and delegate to controllers.
// - Controllers handle HTTP concerns (validation, status codes, error mapping).
// - Services encapsulate business logic (Gemini AI calls, memory persistence).
// - Utils provide cross-cutting helpers such as logging.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const analyzeRoute = require('./routes/analyzeRoute');
const analyzeRateLimiter = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// Basic middleware stack for a JSON API that talks to a Chrome extension.
app.use(express.json());
app.use(
  cors({
    // For hackathon speed we allow all origins.
    // In production you would lock this down to specific Chrome extension IDs or domains.
    origin: '*'
  })
);

// Simple request logging so we can see traffic during the hackathon.
app.use((req, res, next) => {
  logger.info(`Incoming request`, {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
});

// Routes
// Apply rate limiting only to the /analyze endpoint to protect Gemini usage.
app.use('/analyze', analyzeRateLimiter, analyzeRoute);

// Centralized error handler so controllers can just "throw" or call next(err).
app.use((err, req, res, next) => {
  logger.error('Unhandled error in request pipeline', {
    message: err.message,
    stack: err.stack
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message:
      statusCode === 500
        ? 'Internal server error. Please try again.'
        : err.message
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  logger.info(`RecallMate backend listening on port ${PORT}`);
});

module.exports = app;
