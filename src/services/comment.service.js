const { v4: uuidv4 } = require('uuid');
const commentRepo    = require('../repositories/comment.repository');
const ApiError       = require('../utils/ApiError');
const { paginate, paginationMeta } = require('../utils/pagination');

class CommentService {

  // ── Créer ─────────────────────────────────────────────────────
  async create(userId, body) {
    const { articleId, content, parentId } = body;

    // Vérifier que l'article existe et est publié
    const article = commentRepo.findArticleById(articleId);
    if (!article) throw ApiError.notFound('Article not found');
    if (article.status !== 'published') {
      throw ApiError.badRequest('Cannot comment on an unpublished article');
    }

    // Vérifier que le parent existe si fourni
    if (parentId) {
      const parent = commentRepo.findById(parentId);
      if (!parent) throw ApiError.notFound('Parent comment not found');
      if (parent.article_id !== articleId) {
        throw ApiError.badRequest('Parent comment does not belong to this article');
      }
      // Pas de nesting > 1 niveau
      if (parent.parent_id) {
        throw ApiError.badRequest('Cannot reply to a reply');
      }
    }

    const comment = commentRepo.create({
      id: uuidv4(),
      articleId,
      userId,
      parentId: parentId || null,
      content,
    });

    return comment;
  }

  // ── Commentaires d'un article ─────────────────────────────────
  async getByArticle(articleId, query) {
    const article = commentRepo.findArticleById(articleId);
    if (!article) throw ApiError.notFound('Article not found');

    const { page, limit, offset } = paginate(query);
    const comments = commentRepo.findByArticle(articleId, { limit, offset });
    const total    = commentRepo.countByArticle(articleId);

    return {
      comments,
      pagination: paginationMeta(total, page, limit),
    };
  }

  // ── Commentaires en attente ───────────────────────────────────
  async getPending(query) {
    const { page, limit, offset } = paginate(query);
    const comments = commentRepo.findPending({ limit, offset });
    const total    = commentRepo.countPending();

    return {
      comments,
      pagination: paginationMeta(total, page, limit),
    };
  }

  // ── Modifier ──────────────────────────────────────────────────
  async update(commentId, requesterId, requesterRole, content) {
    const comment = commentRepo.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');

    // Seul le propriétaire peut modifier le contenu
    if (comment.user_id !== requesterId) {
      throw ApiError.forbidden('You can only edit your own comments');
    }

    // On ne peut modifier qu'un commentaire pending ou approved
    if (comment.status === 'rejected') {
      throw ApiError.badRequest('Cannot edit a rejected comment');
    }

    return commentRepo.update(commentId, { content, status: 'pending' });
  }

  // ── Supprimer ─────────────────────────────────────────────────
  async delete(commentId, requesterId, requesterRole) {
    const comment = commentRepo.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');

    if (comment.user_id !== requesterId && requesterRole !== 'admin') {
      throw ApiError.forbidden('You are not allowed to delete this comment');
    }

    commentRepo.delete(commentId);
    return true;
  }

  // ── Approuver ─────────────────────────────────────────────────
  async approve(commentId) {
    const comment = commentRepo.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');

    if (comment.status === 'approved') {
      throw ApiError.badRequest('Comment is already approved');
    }

    return commentRepo.update(commentId, { status: 'approved' });
  }

  // ── Rejeter ───────────────────────────────────────────────────
  async reject(commentId) {
    const comment = commentRepo.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');

    if (comment.status === 'rejected') {
      throw ApiError.badRequest('Comment is already rejected');
    }

    return commentRepo.update(commentId, { status: 'rejected' });
  }
}

module.exports = new CommentService();