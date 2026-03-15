// Service responsible for talking to the Google Gemini API using the
// official @google/generative-ai SDK.
// This file hides all AI-specific details behind a simple function so the
// rest of the app just calls analyzeResource(title, url).

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

// In-memory daily counter to provide a simple safety limit.
// This is per running server instance and resets when the process restarts.
let dailyRequestCount = 0;
let currentDay = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const DAILY_LIMIT = 200;

function checkAndIncrementDailyLimit() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDay) {
    currentDay = today;
    dailyRequestCount = 0;
  }

  if (dailyRequestCount >= DAILY_LIMIT) {
    const err = new Error('Daily AI usage limit reached.');
    err.statusCode = 429;
    throw err;
  }

  dailyRequestCount += 1;
}

/**
 * Build the prompt that instructs Gemini to return only JSON.
 */
function buildPrompt(title, url) {
  return [
    'You are helping a developer build a smart memory system for coding resources.',
    'Given a saved browser resource (title and URL), analyze what it is about and return structured metadata.',
    '',
    'Respond with ONLY valid JSON. Do not include any explanations, comments, or code fences.',
    'The JSON object MUST have exactly these string fields:',
    '  - "topic": a short 1–3 word topic, e.g. "Machine Learning", "React Hooks", "TypeScript Generics".',
    '  - "summary": 1–2 sentences summarizing the resource and why it is useful to a developer.',
    '  - "category": a short label grouping similar resources, e.g. "AI/ML", "frontend", "backend", "DevOps", "database", "documentation", "tutorial".',
    '',
    'Example JSON (do not reuse values, just the structure):',
    '{',
    '  "topic": "Machine Learning",',
    '  "summary": "A beginner friendly article explaining transformer architecture.",',
    '  "category": "AI/ML"',
    '}',
    '',
    `Title: ${title}`,
    `URL: ${url}`
  ].join('\n');
}

/**
 * Analyze a resource (title + URL) using Gemini.
 * Returns an object with: { topic, summary, category }.
 */
async function analyzeResource(title, url) {
  if (!GEMINI_API_KEY) {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Please add it to your .env file.'
    );
    err.statusCode = 500;
    throw err;
  }

  // Enforce simple in-memory daily safety limit.
  checkAndIncrementDailyLimit();

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = buildPrompt(title, url);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      logger.error('Failed to parse JSON from Gemini response', {
        rawText: text,
        error: e.message
      });
      const err = new Error('Gemini returned an invalid JSON response.');
      err.statusCode = 502;
      throw err;
    }

    return {
      topic: String(parsed.topic || 'General'),
      summary: String(
        parsed.summary || 'No summary generated, but this resource was saved.'
      ),
      category: String(parsed.category || 'other')
    };
  } catch (error) {
    // If the error already has a statusCode (e.g., limit reached), just rethrow.
    if (error.statusCode) {
      throw error;
    }

    logger.error('Error while calling Gemini API', {
      message: error.message
    });

    const err = new Error('Failed to analyze resource with Gemini.');
    err.statusCode = 502;
    throw err;
  }
}

module.exports = {
  analyzeResource
};

