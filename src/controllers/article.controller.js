const articleService = require('../services/article.service');
const ApiResponse    = require('../utils/ApiResponse');

class ArticleController {

  async create(req, res, next) {
    try {
      const article = await articleService.create(req.user.id, req.body);
      return ApiResponse.created(res, { article }, 'Article created successfully');
    } catch (err) { next(err); }
  }

  async getAll(req, res, next) {
    try {
      const result = await articleService.getAll(req.query);
      return ApiResponse.paginated(res, result.articles, result.pagination);
    } catch (err) { next(err); }
  }

  async getMine(req, res, next) {
    try {
      const result = await articleService.getMine(req.user.id, req.query);
      return ApiResponse.paginated(res, result.articles, result.pagination);
    } catch (err) { next(err); }
  }

  async getBySlug(req, res, next) {
    try {
      const article = await articleService.getBySlug(req.params.slug, req.user || null);
      return ApiResponse.success(res, { article });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const article = await articleService.update(
        req.params.id, req.user.id, req.user.role, req.body
      );
      return ApiResponse.success(res, { article }, 'Article updated successfully');
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      await articleService.delete(req.params.id, req.user.id, req.user.role);
      return ApiResponse.noContent(res);
    } catch (err) { next(err); }
  }

  async publish(req, res, next) {
    try {
      const article = await articleService.publish(
        req.params.id, req.user.id, req.user.role
      );
      return ApiResponse.success(res, { article }, 'Article published successfully');
    } catch (err) { next(err); }
  }

  async archive(req, res, next) {
    try {
      const article = await articleService.archive(
        req.params.id, req.user.id, req.user.role
      );
      return ApiResponse.success(res, { article }, 'Article archived successfully');
    } catch (err) { next(err); }
  }

  async updateCover(req, res, next) {
    try {
      const article = await articleService.updateCover(
        req.params.id, req.user.id, req.user.role, req.file
      );
      return ApiResponse.success(res, { article }, 'Cover image updated successfully');
    } catch (err) { next(err); }
  }
}

module.exports = new ArticleController();