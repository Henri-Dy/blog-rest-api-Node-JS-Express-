const { getDb } = require('../database/db');

class TagRepository {

  findAll() {
    return getDb().prepare(`
      SELECT t.*,
        COUNT(at2.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at2 ON at2.tag_id = t.id
      LEFT JOIN articles a ON a.id = at2.article_id AND a.status = 'published'
      GROUP BY t.id
      ORDER BY t.name ASC
    `).all();
  }

  findById(id) {
    return getDb().prepare(`
      SELECT t.*,
        COUNT(at2.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at2 ON at2.tag_id = t.id
      LEFT JOIN articles a ON a.id = at2.article_id AND a.status = 'published'
      WHERE t.id = ?
      GROUP BY t.id
    `).get(id);
  }

  findBySlug(slug) {
    return getDb().prepare(`
      SELECT t.*,
        COUNT(at2.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at2 ON at2.tag_id = t.id
      LEFT JOIN articles a ON a.id = at2.article_id AND a.status = 'published'
      WHERE t.slug = ?
      GROUP BY t.id
    `).get(slug);
  }

  findByName(name) {
    return getDb().prepare('SELECT * FROM tags WHERE name = ?').get(name);
  }

  findBySlugLike(slug) {
    return getDb().prepare(`
      SELECT slug FROM tags WHERE slug LIKE ?
    `).all(`${slug}%`);
  }

  create({ id, name, slug }) {
    getDb().prepare(`
      INSERT INTO tags (id, name, slug)
      VALUES (@id, @name, @slug)
    `).run({ id, name, slug });

    return this.findById(id);
  }

  update(id, fields) {
    const allowed = ['name', 'slug'];
    const keys    = Object.keys(fields).filter(k => allowed.includes(k));
    if (!keys.length) return this.findById(id);

    const set = keys.map(k => `${k} = @${k}`).join(', ');
    getDb().prepare(`UPDATE tags SET ${set} WHERE id = @id`)
      .run({ ...fields, id });

    return this.findById(id);
  }

  delete(id) {
    return getDb().prepare('DELETE FROM tags WHERE id = ?').run(id);
  }

  getArticles(tagId, { limit, offset } = {}) {
    return getDb().prepare(`
      SELECT a.*, u.name as author_name
      FROM articles a
      JOIN users u ON u.id = a.user_id
      JOIN article_tags at2 ON at2.article_id = a.id
      WHERE at2.tag_id = ? AND a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `).all(tagId, limit ?? 10, offset ?? 0);
  }

  countArticles(tagId) {
    return getDb().prepare(`
      SELECT COUNT(*) as total
      FROM articles a
      JOIN article_tags at2 ON at2.article_id = a.id
      WHERE at2.tag_id = ? AND a.status = 'published'
    `).get(tagId).total;
  }
}

module.exports = new TagRepository();