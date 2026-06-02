const { getDb } = require('../database/db');

class CategoryRepository {

  findAll() {
    return getDb().prepare(`
      SELECT c.*,
        COUNT(ac.article_id) as article_count
      FROM categories c
      LEFT JOIN article_categories ac ON ac.category_id = c.id
      LEFT JOIN articles a ON a.id = ac.article_id AND a.status = 'published'
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
  }

  findById(id) {
    return getDb().prepare(`
      SELECT c.*,
        COUNT(ac.article_id) as article_count
      FROM categories c
      LEFT JOIN article_categories ac ON ac.category_id = c.id
      LEFT JOIN articles a ON a.id = ac.article_id AND a.status = 'published'
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id);
  }

  findBySlug(slug) {
    return getDb().prepare(`
      SELECT c.*,
        COUNT(ac.article_id) as article_count
      FROM categories c
      LEFT JOIN article_categories ac ON ac.category_id = c.id
      LEFT JOIN articles a ON a.id = ac.article_id AND a.status = 'published'
      WHERE c.slug = ?
      GROUP BY c.id
    `).get(slug);
  }

  findByName(name) {
    return getDb().prepare('SELECT * FROM categories WHERE name = ?').get(name);
  }

  findBySlugLike(slug) {
    return getDb().prepare(`
      SELECT slug FROM categories WHERE slug LIKE ?
    `).all(`${slug}%`);
  }

  create({ id, name, slug, description }) {
    getDb().prepare(`
      INSERT INTO categories (id, name, slug, description)
      VALUES (@id, @name, @slug, @description)
    `).run({ id, name, slug, description: description || null });

    return this.findById(id);
  }

  update(id, fields) {
    const allowed = ['name', 'slug', 'description'];
    const keys    = Object.keys(fields).filter(k => allowed.includes(k));
    if (!keys.length) return this.findById(id);

    const set = keys.map(k => `${k} = @${k}`).join(', ');
    getDb().prepare(`UPDATE categories SET ${set} WHERE id = @id`)
      .run({ ...fields, id });

    return this.findById(id);
  }

  delete(id) {
    return getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  getArticles(categoryId, { limit, offset } = {}) {
    return getDb().prepare(`
      SELECT a.*, u.name as author_name
      FROM articles a
      JOIN users u ON u.id = a.user_id
      JOIN article_categories ac ON ac.article_id = a.id
      WHERE ac.category_id = ? AND a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `).all(categoryId, limit ?? 10, offset ?? 0);
  }

  countArticles(categoryId) {
    return getDb().prepare(`
      SELECT COUNT(*) as total
      FROM articles a
      JOIN article_categories ac ON ac.article_id = a.id
      WHERE ac.category_id = ? AND a.status = 'published'
    `).get(categoryId).total;
  }
}

module.exports = new CategoryRepository();