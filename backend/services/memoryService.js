// Service that manages the "smart memory" JSON store.
// For the hackathon prototype we use a simple JSON file instead of a database.
// This keeps persistence easy to inspect and avoids extra infrastructure.

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

/**
 * Ensure that the data directory and JSON file exist.
 * This runs lazily the first time we read or write.
 */
function ensureStorageInitialized() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, '[]', 'utf8');
  }
}

function readMemory() {
  ensureStorageInitialized();

  const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    logger.error('Failed to parse memory.json; resetting file.', {
      message: e.message
    });
    fs.writeFileSync(MEMORY_FILE, '[]', 'utf8');
    return [];
  }
}

function writeMemory(entries) {
  ensureStorageInitialized();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Save a new memory entry to the JSON file.
 * Entry is an object with: { title, url, topic, summary, category }.
 */
async function saveMemory(entry) {
  const existing = readMemory();

  const enriched = {
    ...entry,
    timestamp: new Date().toISOString()
  };

  const updated = [...existing, enriched];
  writeMemory(updated);

  logger.debug('Memory entry saved', {
    title: entry.title,
    url: entry.url
  });

  return enriched;
}

module.exports = {
  saveMemory
};

