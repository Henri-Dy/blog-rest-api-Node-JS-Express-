const { getDb } = require('../database/db');

class UserRepository {

  findAll({ limit, offset, role } = {}) {
    let query  = 'SELECT id, name, email, role, bio, avatar, is_active, created_at, updated_at FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit ?? 10, offset ?? 0);

    return getDb().prepare(query).all(...params);
  }

  countAll({ role } = {}) {
    let query  = 'SELECT COUNT(*) as total FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    return getDb().prepare(query).get(...params).total;
  }

  findById(id) {
    return getDb()
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id);
  }

  findByEmail(email) {
    return getDb()
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email);
  }

  create({ id, name, email, password, role = 'reader' }) {
    getDb().prepare(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (@id, @name, @email, @password, @role)
    `).run({ id, name, email, password, role });

    return this.findById(id);
  }

  update(id, fields) {
    const allowed = ['name', 'email', 'password', 'bio', 'avatar', 'is_active', 'role'];
    const keys    = Object.keys(fields).filter(k => allowed.includes(k));
    if (!keys.length) return this.findById(id);

    const set = keys.map(k => `${k} = @${k}`).join(', ');
    getDb().prepare(`
      UPDATE users SET ${set}, updated_at = datetime('now') WHERE id = @id
    `).run({ ...fields, id });

    return this.findById(id);
  }

  delete(id) {
    return getDb()
      .prepare('DELETE FROM users WHERE id = ?')
      .run(id);
  }

  // ── Refresh tokens ───────────────────────────────────────────
  saveRefreshToken({ id, userId, token, expiresAt }) {
    getDb().prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (@id, @userId, @token, @expiresAt)
    `).run({ id, userId, token, expiresAt });
  }

  findRefreshToken(token) {
    return getDb()
      .prepare('SELECT * FROM refresh_tokens WHERE token = ?')
      .get(token);
  }

  deleteRefreshToken(token) {
    return getDb()
      .prepare('DELETE FROM refresh_tokens WHERE token = ?')
      .run(token);
  }

  deleteAllRefreshTokens(userId) {
    return getDb()
      .prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
      .run(userId);
  }
}

module.exports = new UserRepository();