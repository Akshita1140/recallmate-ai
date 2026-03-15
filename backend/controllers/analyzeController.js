// Controller for the /analyze endpoint.
// Responsibilities:
// - Validate incoming payload from the Chrome extension.
// - Orchestrate calls to the Gemini service and memory service.
// - Shape the HTTP response for the client.

const geminiService = require('../services/geminiService');
const memoryService = require('../services/memoryService');
const logger = require('../utils/logger');

/**
 * POST /analyze
 * Body: { title: string, url: string }
 */
async function analyzeResource(req, res, next) {
  try {
    const { title, url } = req.body || {};

    // Basic validation to keep input sane; more rules can be added later.
    if (!title || typeof title !== 'string') {
      const err = new Error('Field "title" is required and must be a string.');
      err.statusCode = 400;
      throw err;
    }

    if (!url || typeof url !== 'string') {
      const err = new Error('Field "url" is required and must be a string.');
      err.statusCode = 400;
      throw err;
    }

    // Ask Gemini to analyze this resource and come back with metadata.
    const analysis = await geminiService.analyzeResource(title, url);

    const memoryEntry = {
      title,
      url,
      topic: analysis.topic,
      summary: analysis.summary,
      category: analysis.category
    };

    // Persist the analyzed resource in our JSON "database".
    await memoryService.saveMemory(memoryEntry);

    logger.info('Resource analyzed and stored in memory', {
      title,
      url,
      topic: analysis.topic,
      category: analysis.category
    });

    return res.status(200).json({
      status: 'success',
      topic: analysis.topic,
      summary: analysis.summary,
      category: analysis.category
    });
  } catch (err) {
    // Delegate to the centralized error handler in server.js.
    next(err);
  }
}

module.exports = {
  analyzeResource
};

