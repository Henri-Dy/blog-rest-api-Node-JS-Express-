const router   = require('express').Router();
const ctrl     = require('../controllers/user.controller');
const auth     = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { uploadAvatar } = require('../config/multer');
const { updateUserValidator, listUsersValidator } = require('../validators/user.validator');

// GET /users — admin seulement
router.get(
  '/',
  auth,
  authorize('admin'),
  listUsersValidator,
  validate,
  ctrl.getAll
);

// GET /users/:id — connecté
router.get(
  '/:id',
  auth,
  ctrl.getById
);

// PUT /users/:id — owner ou admin
router.put(
  '/:id',
  auth,
  updateUserValidator,
  validate,
  ctrl.update
);

// DELETE /users/:id — owner ou admin
router.delete(
  '/:id',
  auth,
  ctrl.delete
);

// POST /users/:id/avatar — owner ou admin
router.post(
  '/:id/avatar',
  auth,
  uploadAvatar.single('avatar'),
  ctrl.updateAvatar
);

module.exports = router;