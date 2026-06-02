const tagService  = require('../services/tag.service');
const ApiResponse = require('../utils/ApiResponse');

class TagController {

  async getAll(req, res, next) {
    try {
      const tags = await tagService.getAll();
      return ApiResponse.success(res, { tags });
    } catch (err) { next(err); }
  }

  async getBySlug(req, res, next) {
    try {
      const result = await tagService.getBySlug(req.params.slug, req.query);
      return ApiResponse.paginated(res, result.articles, result.pagination, 'Success', {
        tag: result.tag,
      });
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const tag = await tagService.create(req.body);
      return ApiResponse.created(res, { tag }, 'Tag created successfully');
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const tag = await tagService.update(req.params.id, req.body);
      return ApiResponse.success(res, { tag }, 'Tag updated successfully');
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      await tagService.delete(req.params.id);
      return ApiResponse.noContent(res);
    } catch (err) { next(err); }
  }
}

module.exports = new TagController();