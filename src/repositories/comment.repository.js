const { getDb } = require('../database/db');

class CommentRepository {

  create({ id, articleId, userId, parentId, content }) {
    getDb().prepare(`
      INSERT INTO comments (id, article_id, user_id, parent_id, content, status)
      VALUES (@id, @articleId, @userId, @parentId, @content, 'pending')
    `).run({ id, articleId, userId, parentId: parentId || null, content });

    return this.findById(id);
  }

  findById(id) {
    return getDb().prepare(`
      SELECT c.*,
        u.name  as author_name,
        u.avatar as author_avatar
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
    `).get(id);
  }

  // ── Commentaires d'un article (arbre à 2 niveaux) ────────────
  findByArticle(articleId, { limit, offset } = {}) {
    // Racines uniquement
    const roots = getDb().prepare(`
      SELECT c.*,
        u.name   as author_name,
        u.avatar as author_avatar
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.article_id = ?
        AND c.parent_id IS NULL
        AND c.status = 'approved'
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `).all(articleId, limit ?? 20, offset ?? 0);

    // Réponses pour chaque racine
    const getChildren = getDb().prepare(`
      SELECT c.*,
        u.name   as author_name,
        u.avatar as author_avatar
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.parent_id = ?
        AND c.status = 'approved'
      ORDER BY c.created_at ASC
    `);

    return roots.map(root => ({
      ...root,
      replies: getChildren.all(root.id),
    }));
  }

  countByArticle(articleId) {
    return getDb().prepare(`
      SELECT COUNT(*) as total
      FROM comments
      WHERE article_id = ?
        AND parent_id IS NULL
        AND status = 'approved'
    `).get(articleId).total;
  }

  // ── Commentaires en attente (modération) ─────────────────────
  findPending({ limit, offset } = {}) {
    return getDb().prepare(`
      SELECT c.*,
        u.name   as author_name,
        u.avatar as author_avatar,
        a.title  as article_title,
        a.slug   as article_slug
      FROM comments c
      JOIN users    u ON u.id = c.user_id
      JOIN articles a ON a.id = c.article_id
      WHERE c.status = 'pending'
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `).all(limit ?? 20, offset ?? 0);
  }

  countPending() {
    return getDb().prepare(`
      SELECT COUNT(*) as total FROM comments WHERE status = 'pending'
    `).get().total;
  }

  update(id, fields) {
    const allowed = ['content', 'status'];
    const keys    = Object.keys(fields).filter(k => allowed.includes(k));
    if (!keys.length) return this.findById(id);

    const set = keys.map(k => `${k} = @${k}`).join(', ');
    getDb().prepare(`
      UPDATE comments SET ${set}, updated_at = datetime('now') WHERE id = @id
    `).run({ ...fields, id });

    return this.findById(id);
  }

  delete(id) {
    // Supprime aussi les réponses enfants (CASCADE géré par SQLite FK)
    return getDb().prepare('DELETE FROM comments WHERE id = ?').run(id);
  }

  // Vérifier si l'article accepte des commentaires
  findArticleById(articleId) {
    return getDb().prepare(`
      SELECT id, status FROM articles WHERE id = ?
    `).get(articleId);
  }
}

module.exports = new CommentRepository();