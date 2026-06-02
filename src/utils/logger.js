const isTest = process.env.NODE_ENV === 'test';

const logger = {
  info:  (...args) => !isTest && console.log('[INFO] ',  ...args),
  warn:  (...args) => !isTest && console.warn('[WARN] ',  ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => !isTest && console.debug('[DEBUG]', ...args),
};

module.exports = logger;