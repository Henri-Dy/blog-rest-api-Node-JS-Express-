const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const jwtConfig   = require('../config/jwt');
const userRepo    = require('../repositories/user.repository');
const ApiError    = require('../utils/ApiError');

class AuthService {

  // ── Register ────────────────────────────────────────────────
  async register({ name, email, password, role = 'reader' }) {
    const existing = userRepo.findByEmail(email);
    if (existing) throw ApiError.conflict('Email already in use');

    const hashed = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const user   = userRepo.create({ id: uuidv4(), name, email, password: hashed, role });

    return this._sanitize(user);
  }

  // ── Login ───────────────────────────────────────────────────
  async login({ email, password }) {
    const user = userRepo.findByEmail(email);
    if (!user) throw ApiError.unauthorized('Invalid credentials');
    if (!user.is_active) throw ApiError.unauthorized('Account disabled');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw ApiError.unauthorized('Invalid credentials');

    const accessToken  = this._generateAccessToken(user);
    const refreshToken = this._generateRefreshToken(user);

    // Persister le refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    userRepo.saveRefreshToken({ id: uuidv4(), userId: user.id, token: refreshToken, expiresAt });

    return { user: this._sanitize(user), accessToken, refreshToken };
  }

  // ── Logout ──────────────────────────────────────────────────
  async logout(refreshToken) {
    if (refreshToken) userRepo.deleteRefreshToken(refreshToken);
    return true;
  }

  // ── Refresh ─────────────────────────────────────────────────
  async refresh(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized('No refresh token provided');

    // Vérifier en base
    const stored = userRepo.findRefreshToken(refreshToken);
    if (!stored) throw ApiError.unauthorized('Invalid refresh token');

    // Vérifier expiration
    if (new Date(stored.expires_at) < new Date()) {
      userRepo.deleteRefreshToken(refreshToken);
      throw ApiError.unauthorized('Refresh token expired');
    }

    // Vérifier signature JWT
    let payload;
    try {
      payload = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    } catch {
      userRepo.deleteRefreshToken(refreshToken);
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = userRepo.findById(payload.sub);
    if (!user || !user.is_active) throw ApiError.unauthorized('User not found or disabled');

    // Rotation : supprimer l'ancien, émettre un nouveau
    userRepo.deleteRefreshToken(refreshToken);
    const newAccessToken  = this._generateAccessToken(user);
    const newRefreshToken = this._generateRefreshToken(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    userRepo.saveRefreshToken({ id: uuidv4(), userId: user.id, token: newRefreshToken, expiresAt });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ── Me ──────────────────────────────────────────────────────
  async me(userId) {
    const user = userRepo.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return this._sanitize(user);
  }

  // ── Helpers privés ──────────────────────────────────────────
  _generateAccessToken(user) {
    return jwt.sign(
      { sub: user.id, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  _generateRefreshToken(user) {
    return jwt.sign(
      { sub: user.id },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );
  }

  _sanitize(user) {
    const { password, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();