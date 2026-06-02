const commentService = require('../services/comment.service');
const ApiResponse    = require('../utils/ApiResponse');

class CommentController {

  async create(req, res, next) {
    try {
      const comment = await commentService.create(req.user.id, req.body);
      return ApiResponse.created(res, { comment }, 'Comment submitted for moderation');
    } catch (err) { next(err); }
  }

  async getByArticle(req, res, next) {
    try {
      const result = await commentService.getByArticle(req.params.articleId, req.query);
      return ApiResponse.paginated(res, result.comments, result.pagination);
    } catch (err) { next(err); }
  }

  async getPending(req, res, next) {
    try {
      const result = await commentService.getPending(req.query);
      return ApiResponse.paginated(res, result.comments, result.pagination);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const comment = await commentService.update(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body.content
      );
      return ApiResponse.success(res, { comment }, 'Comment updated successfully');
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      await commentService.delete(req.params.id, req.user.id, req.user.role);
      return ApiResponse.noContent(res);
    } catch (err) { next(err); }
  }

  async approve(req, res, next) {
    try {
      const comment = await commentService.approve(req.params.id);
      return ApiResponse.success(res, { comment }, 'Comment approved');
    } catch (err) { next(err); }
  }

  async reject(req, res, next) {
    try {
      const comment = await commentService.reject(req.params.id);
      return ApiResponse.success(res, { comment }, 'Comment rejected');
    } catch (err) { next(err); }
  }
}

module.exports = new CommentController();