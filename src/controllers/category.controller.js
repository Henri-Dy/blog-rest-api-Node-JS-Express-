const categoryService = require('../services/category.service');
const ApiResponse     = require('../utils/ApiResponse');

class CategoryController {

  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAll();
      return ApiResponse.success(res, { categories });
    } catch (err) { next(err); }
  }

  async getBySlug(req, res, next) {
    try {
      const result = await categoryService.getBySlug(req.params.slug, req.query);
      return ApiResponse.paginated(res, result.articles, result.pagination, 'Success', {
        category: result.category,
      });
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body);
      return ApiResponse.created(res, { category }, 'Category created successfully');
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.update(req.params.id, req.body);
      return ApiResponse.success(res, { category }, 'Category updated successfully');
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      await categoryService.delete(req.params.id);
      return ApiResponse.noContent(res);
    } catch (err) { next(err); }
  }
}

module.exports = new CategoryController();