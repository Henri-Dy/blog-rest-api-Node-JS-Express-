const ApiError = require('../utils/ApiError');
const logger   = require('../utils/logger');

function errorMiddleware(err, req, res, next) {
  // Erreurs opérationnelles (4xx) → warn, erreurs système (5xx) → error
  if (err instanceof ApiError && err.isOperational) {
    if (err.statusCode >= 500) {
      logger.error(`${err.message}`);
    } else {
      logger.warn(`[${err.statusCode}] ${err.message}`);
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors?.length && { errors: err.errors }),
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    logger.warn(`[409] Duplicate resource`);
    return res.status(409).json({ success: false, message: 'Resource already exists' });
  }

  logger.error(`[500] ${err.message}`, err.stack);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

module.exports = errorMiddleware;