const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');

class UserController {

  async getAll(req, res, next) {
    try {
      const result = await userService.getAll(req.query);
      return ApiResponse.paginated(res, result.users, result.pagination);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      return ApiResponse.success(res, { user });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body
      );
      return ApiResponse.success(res, { user }, 'Profile updated successfully');
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      await userService.delete(req.params.id, req.user.id, req.user.role);
      return ApiResponse.noContent(res);
    } catch (err) { next(err); }
  }

  async updateAvatar(req, res, next) {
    try {
      const user = await userService.updateAvatar(
        req.params.id,
        req.user.id,
        req.user.role,
        req.file
      );
      return ApiResponse.success(res, { user }, 'Avatar updated successfully');
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();