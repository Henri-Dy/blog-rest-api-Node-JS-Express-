const bcrypt         = require('bcryptjs');
const path           = require('path');
const fs             = require('fs');
const userRepo       = require('../repositories/user.repository');
const ApiError       = require('../utils/ApiError');
const { paginate, paginationMeta } = require('../utils/pagination');

class UserService {

  // ── Liste (admin only) ───────────────────────────────────────
  async getAll(query) {
    const { page, limit, offset } = paginate(query);
    const role  = query.role || null;

    const users = userRepo.findAll({ limit, offset, role });
    const total = userRepo.countAll({ role });

    return {
      users: users.map(this._sanitize),
      pagination: paginationMeta(total, page, limit),
    };
  }

  // ── Profil par ID ────────────────────────────────────────────
  async getById(id) {
    const user = userRepo.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    return this._sanitize(user);
  }

  // ── Modifier profil ──────────────────────────────────────────
  async update(targetId, requesterId, requesterRole, body) {
    this._checkOwnerOrAdmin(targetId, requesterId, requesterRole);

    const user = userRepo.findById(targetId);
    if (!user) throw ApiError.notFound('User not found');

    // Seul l'admin peut changer le rôle ou is_active
    const fields = { name: body.name, bio: body.bio };

    if (requesterRole === 'admin') {
      if (body.role)      fields.role      = body.role;
      if (body.is_active !== undefined) fields.is_active = body.is_active ? 1 : 0;
    }

    // Changement de mot de passe
    if (body.password) {
      if (!body.currentPassword) throw ApiError.badRequest('Current password is required');
      const valid = await bcrypt.compare(body.currentPassword, user.password);
      if (!valid) throw ApiError.badRequest('Current password is incorrect');
      fields.password = await bcrypt.hash(body.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    }

    // Changement d'email
    if (body.email && body.email !== user.email) {
      const existing = userRepo.findByEmail(body.email);
      if (existing) throw ApiError.conflict('Email already in use');
      fields.email = body.email;
    }

    // Filtrer les champs undefined
    Object.keys(fields).forEach(k => fields[k] === undefined && delete fields[k]);

    const updated = userRepo.update(targetId, fields);
    return this._sanitize(updated);
  }

  // ── Supprimer compte ─────────────────────────────────────────
  async delete(targetId, requesterId, requesterRole) {
    this._checkOwnerOrAdmin(targetId, requesterId, requesterRole);

    const user = userRepo.findById(targetId);
    if (!user) throw ApiError.notFound('User not found');

    // Supprimer tous les refresh tokens
    userRepo.deleteAllRefreshTokens(targetId);
    userRepo.delete(targetId);

    // Supprimer avatar si présent
    if (user.avatar) this._deleteFile(user.avatar);

    return true;
  }

  // ── Upload avatar ────────────────────────────────────────────
  async updateAvatar(targetId, requesterId, requesterRole, file) {
    this._checkOwnerOrAdmin(targetId, requesterId, requesterRole);

    if (!file) throw ApiError.badRequest('No file uploaded');

    const user = userRepo.findById(targetId);
    if (!user) throw ApiError.notFound('User not found');

    // Supprimer l'ancien avatar
    if (user.avatar) this._deleteFile(user.avatar);

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const updated   = userRepo.update(targetId, { avatar: avatarUrl });

    return this._sanitize(updated);
  }

  // ── Helpers privés ───────────────────────────────────────────
  _checkOwnerOrAdmin(targetId, requesterId, requesterRole) {
    if (targetId !== requesterId && requesterRole !== 'admin') {
      throw ApiError.forbidden('You are not allowed to perform this action');
    }
  }

  _deleteFile(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch {
      // Non bloquant
    }
  }

  _sanitize(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }
}

module.exports = new UserService();