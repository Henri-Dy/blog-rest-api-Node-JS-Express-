const { getDb } = require('../database/db');

class ArticleRepository {

  // ── Création ─────────────────────────────────────────────────
  create({ id, userId, title, slug, excerpt, content, status = 'draft' }) {
    getDb().prepare(`
      INSERT INTO articles (id, user_id, title, slug, excerpt, content, status)
      VALUES (@id, @userId, @title, @slug, @excerpt, @content, @status)
    `).run({ id, userId, title, slug, excerpt, content, status });

    return this.findById(id);
  }

  // ── Recherche par ID ─────────────────────────────────────────
  findById(id) {
    return getDb().prepare(`
      SELECT a.*, u.name as author_name, u.avatar as author_avatar
      FROM articles a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
    `).get(id);
  }

  // ── Recherche par slug ───────────────────────────────────────
  findBySlug(slug) {
    return getDb().prepare(`
      SELECT a.*, u.name as author_name, u.avatar as author_avatar
      FROM articles a
      JOIN users u ON u.id = a.user_id
      WHERE a.slug = ?
    `).get(slug);
  }

  // ── Liste avec filtres ───────────────────────────────────────
  findAll({ limit, offset, status, userId, search, categoryId, tagId, sortBy, sortOrder }) {
    let where  = [];
    let params = [];

    if (status)     { where.push('a.status = ?');          params.push(status); }
    if (userId)     { where.push('a.user_id = ?');         params.push(userId); }
    if (search)     { where.push('(a.title LIKE ? OR a.content LIKE ?)');
                      params.push(`%${search}%`, `%${search}%`); }
    if (categoryId) { where.push(`EXISTS (
                        SELECT 1 FROM article_categories ac
                        WHERE ac.article_id = a.id AND ac.category_id = ?
                      )`);
                      params.push(categoryId); }
    if (tagId)      { where.push(`EXISTS (
                        SELECT 1 FROM article_tags at2
                        WHERE at2.article_id = a.id AND at2.tag_id = ?
                      )`);
                      params.push(tagId); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const allowed   = ['created_at', 'published_at', 'title'];
    const orderCol  = allowed.includes(sortBy) ? sortBy : 'created_at';
    const orderDir  = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const rows = getDb().prepare(`
      SELECT a.*, u.name as author_name, u.avatar as author_avatar
      FROM articles a
      JOIN users u ON u.id = a.user_id
      ${whereClause}
      ORDER BY a.${orderCol} ${orderDir}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return rows;
  }

  // ── Comptage ─────────────────────────────────────────────────
  countAll({ status, userId, search, categoryId, tagId }) {
    let where  = [];
    let params = [];

    if (status)     { where.push('a.status = ?');          params.push(status); }
    if (userId)     { where.push('a.user_id = ?');         params.push(userId); }
    if (search)     { where.push('(a.title LIKE ? OR a.content LIKE ?)');
                      params.push(`%${search}%`, `%${search}%`); }
    if (categoryId) { where.push(`EXISTS (
                        SELECT 1 FROM article_categories ac
                        WHERE ac.article_id = a.id AND ac.category_id = ?
                      )`);
                      params.push(categoryId); }
    if (tagId)      { where.push(`EXISTS (
                        SELECT 1 FROM article_tags at2
                        WHERE at2.article_id = a.id AND at2.tag_id = ?
                      )`);
                      params.push(tagId); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    return getDb().prepare(`
      SELECT COUNT(*) as total
      FROM articles a
      ${whereClause}
    `).get(...params).total;
  }

  // ── Mise à jour ──────────────────────────────────────────────
  update(id, fields) {
    const allowed = ['title', 'slug', 'excerpt', 'content', 'cover_image', 'status', 'published_at'];
    const keys    = Object.keys(fields).filter(k => allowed.includes(k));
    if (!keys.length) return this.findById(id);

    const set = keys.map(k => `${k} = @${k}`).join(', ');
    getDb().prepare(`
      UPDATE articles SET ${set}, updated_at = datetime('now') WHERE id = @id
    `).run({ ...fields, id });

    return this.findById(id);
  }

  // ── Suppression ──────────────────────────────────────────────
  delete(id) {
    return getDb().prepare('DELETE FROM articles WHERE id = ?').run(id);
  }

  // ── Slug unique ──────────────────────────────────────────────
  findBySlugLike(slug) {
    return getDb().prepare(`
      SELECT slug FROM articles WHERE slug LIKE ? ORDER BY slug
    `).all(`${slug}%`);
  }

  // ── Tags & Categories d'un article ───────────────────────────
  getCategories(articleId) {
    return getDb().prepare(`
      SELECT c.* FROM categories c
      JOIN article_categories ac ON ac.category_id = c.id
      WHERE ac.article_id = ?
    `).all(articleId);
  }

  getTags(articleId) {
    return getDb().prepare(`
      SELECT t.* FROM tags t
      JOIN article_tags at2 ON at2.tag_id = t.id
      WHERE at2.article_id = ?
    `).all(articleId);
  }

  // ── Association categories ───────────────────────────────────
  setCategories(articleId, categoryIds) {
    const db = getDb();
    db.prepare('DELETE FROM article_categories WHERE article_id = ?').run(articleId);
    const insert = db.prepare(`
      INSERT OR IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)
    `);
    for (const cid of categoryIds) insert.run(articleId, cid);
  }

  // ── Association tags ─────────────────────────────────────────
  setTags(articleId, tagIds) {
    const db = getDb();
    db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(articleId);
    const insert = db.prepare(`
      INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)
    `);
    for (const tid of tagIds) insert.run(articleId, tid);
  }
}

module.exports = new ArticleRepository();