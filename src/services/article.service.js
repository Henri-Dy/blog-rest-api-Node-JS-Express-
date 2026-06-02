const { v4: uuidv4 }  = require('uuid');
const slugify          = require('slugify');
const path             = require('path');
const fs               = require('fs');
const articleRepo      = require('../repositories/article.repository');
const ApiError         = require('../utils/ApiError');
const { paginate, paginationMeta } = require('../utils/pagination');

class ArticleService {

  // ── Créer ────────────────────────────────────────────────────
  async create(userId, body) {
    const slug    = await this._uniqueSlug(body.title);
    const article = articleRepo.create({
      id:      uuidv4(),
      userId,
      title:   body.title,
      slug,
      excerpt: body.excerpt || null,
      content: body.content,
      status:  body.status === 'published' ? 'published' : 'draft',
    });

    if (body.status === 'published') {
      articleRepo.update(article.id, { published_at: new Date().toISOString() });
    }

    if (body.categoryIds?.length) articleRepo.setCategories(article.id, body.categoryIds);
    if (body.tagIds?.length)      articleRepo.setTags(article.id, body.tagIds);

    return this._withRelations(article.id);
  }

  // ── Liste publique ───────────────────────────────────────────
  async getAll(query) {
    const { page, limit, offset } = paginate(query);
    const filters = {
      status:     'published',
      search:     query.search     || null,
      categoryId: query.categoryId || null,
      tagId:      query.tagId      || null,
      sortBy:     query.sortBy     || 'published_at',
      sortOrder:  query.sortOrder  || 'desc',
    };

    const articles = articleRepo.findAll({ ...filters, limit, offset });
    const total    = articleRepo.countAll(filters);

    return {
      articles: await Promise.all(articles.map(a => this._withRelations(a.id))),
      pagination: paginationMeta(total, page, limit),
    };
  }

  // ── Mes articles ─────────────────────────────────────────────
  async getMine(userId, query) {
    const { page, limit, offset } = paginate(query);
    const filters = {
      userId,
      status:    query.status   || null,
      search:    query.search   || null,
      sortBy:    query.sortBy   || 'created_at',
      sortOrder: query.sortOrder || 'desc',
    };

    const articles = articleRepo.findAll({ ...filters, limit, offset });
    const total    = articleRepo.countAll(filters);

    return {
      articles: await Promise.all(articles.map(a => this._withRelations(a.id))),
      pagination: paginationMeta(total, page, limit),
    };
  }

  // ── Détail par slug ──────────────────────────────────────────
  async getBySlug(slug, user = null) {
    const article = articleRepo.findBySlug(slug);
    if (!article) throw ApiError.notFound('Article not found');

    // Article non publié : seul le propriétaire ou admin peut voir
    if (article.status !== 'published') {
      if (!user) throw ApiError.notFound('Article not found');
      if (article.user_id !== user.id && user.role !== 'admin') {
        throw ApiError.notFound('Article not found');
      }
    }

    return this._withRelations(article.id);
  }

  // ── Modifier ─────────────────────────────────────────────────
  async update(articleId, requesterId, requesterRole, body) {
    const article = articleRepo.findById(articleId);
    if (!article) throw ApiError.notFound('Article not found');
    this._checkOwnerOrAdmin(article, requesterId, requesterRole);

    const fields = {};
    if (body.title !== undefined) {
      fields.title = body.title;
      fields.slug  = await this._uniqueSlug(body.title, articleId);
    }
    if (body.excerpt !== undefined) fields.excerpt = body.excerpt;
    if (body.content !== undefined) fields.content = body.content;

    if (Object.keys(fields).length) articleRepo.update(articleId, fields);
    if (body.categoryIds !== undefined) articleRepo.setCategories(articleId, body.categoryIds);
    if (body.tagIds !== undefined)      articleRepo.setTags(articleId, body.tagIds);

    return this._withRelations(articleId);
  }

  // ── Supprimer ────────────────────────────────────────────────
  async delete(articleId, requesterId, requesterRole) {
    const article = articleRepo.findById(articleId);
    if (!article) throw ApiError.notFound('Article not found');
    this._checkOwnerOrAdmin(article, requesterId, requesterRole);

    if (article.cover_image) this._deleteFile(article.cover_image);
    articleRepo.delete(articleId);
    return true;
  }

  // ── Publier ──────────────────────────────────────────────────
  async publish(articleId, requesterId, requesterRole) {
    const article = articleRepo.findById(articleId);
    if (!article) throw ApiError.notFound('Article not found');
    this._checkOwnerOrAdmin(article, requesterId, requesterRole);

    if (article.status === 'published') throw ApiError.badRequest('Article is already published');

    articleRepo.update(articleId, {
      status:       'published',
      published_at: new Date().toISOString(),
    });

    return this._withRelations(articleId);
  }

  // ── Archiver ─────────────────────────────────────────────────
  async archive(articleId, requesterId, requesterRole) {
    const article = articleRepo.findById(articleId);
    if (!article) throw ApiError.notFound('Article not found');
    this._checkOwnerOrAdmin(article, requesterId, requesterRole);

    articleRepo.update(articleId, { status: 'archived' });
    return this._withRelations(articleId);
  }

  // ── Upload cover ─────────────────────────────────────────────
  async updateCover(articleId, requesterId, requesterRole, file) {
    if (!file) throw ApiError.badRequest('No file uploaded');

    const article = articleRepo.findById(articleId);
    if (!article) throw ApiError.notFound('Article not found');
    this._checkOwnerOrAdmin(article, requesterId, requesterRole);

    if (article.cover_image) this._deleteFile(article.cover_image);

    const coverUrl = `/uploads/covers/${file.filename}`;
    articleRepo.update(articleId, { cover_image: coverUrl });

    return this._withRelations(articleId);
  }

  // ── Helpers privés ───────────────────────────────────────────
  async _uniqueSlug(title, excludeId = null) {
    const base     = slugify(title, { lower: true, strict: true });
    const existing = articleRepo.findBySlugLike(base);
    const slugs    = existing.map(r => r.slug).filter(s => {
      if (!excludeId) return true;
      const art = articleRepo.findBySlug(s);
      return art && art.id !== excludeId;
    });

    if (!slugs.includes(base)) return base;

    let i = 1;
    while (slugs.includes(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  async _withRelations(articleId) {
    const article    = articleRepo.findById(articleId);
    const categories = articleRepo.getCategories(articleId);
    const tags       = articleRepo.getTags(articleId);
    return { ...article, categories, tags };
  }

  _checkOwnerOrAdmin(article, requesterId, requesterRole) {
    if (article.user_id !== requesterId && requesterRole !== 'admin') {
      throw ApiError.forbidden('You are not