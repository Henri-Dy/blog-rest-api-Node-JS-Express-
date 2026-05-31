const authService   = require('../services/auth.service');
const ApiResponse   = require('../utils/ApiResponse');

class AuthController {

  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const user = await authService.register({ name, email, password, role });
      return ApiResponse.created(res, { user }, 'Account created successfully');
    } catch (err) { next(err); }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return ApiResponse.success(res, result, 'Login successful');
    } catch (err) { next(err); }
  }

  async logout(req, res, next) {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      await authService.logout(token);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) { next(err); }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      return ApiResponse.success(res, tokens, 'Tokens refreshed');
    } catch (err) { next(err); }
  }

  async me(req, res, next) {
    try {
      const user = await authService.me(req.user.id);
      return ApiResponse.success(res, { user });
    } catch (err) { next(err); }
  }
}

module.exports = new AuthController();