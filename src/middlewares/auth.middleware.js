const jwt      = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { getDb } = require('../database/db');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(ApiError.unauthorized('No token provided'));

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = getDb()
      .prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?')
      .get(payload.sub);

    if (!user)           return next(ApiError.unauthorized('User not found'));
    if (!user.is_active) return next(ApiError.unauthorized('Account disabled'));

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Token expired'));
    if (err.name === 'JsonWebTokenError')  return next(ApiError.unauthorized('Invalid token'));
    next(err);
  }
}

// Authentification optionnelle — ne bloque pas si pas de token
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = getDb()
      .prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?')
      .get(payload.sub);

    if (user?.is_active) req.user = user;
    next();
  } catch {
    next(); // Token invalide ignoré silencieusement
  }
}

module.exports = authenticate;
module.exports.optionalAuth = optionalAuth;