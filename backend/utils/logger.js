// Lightweight logger wrapper.
// For a hackathon project this keeps logging consistent and easy to swap
// for a more advanced logger (e.g., Winston, Pino) later.

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (!meta) return base;
  try {
    return `${base} ${JSON.stringify(meta)}`;
  } catch {
    return base;
  }
}

const logger = {
  info(message, meta) {
    console.log(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    console.error(formatMessage('error', message, meta));
  },
  debug(message, meta) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, meta));
    }
  }
};

module.exports = logger;

