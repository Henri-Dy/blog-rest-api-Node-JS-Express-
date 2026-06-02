const router   = require('express').Router();
const ctrl     = require('../controllers/category.controller');
const auth     = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require('../validators/category.validator');

// ── Public ────────────────────────────────────────────────────
router.get('/',      ctrl.getAll);
router.get('/:slug', ctrl.getBySlug);

// ── Admin only ────────────────────────────────────────────────
router.post(
  '/',
  auth,
  authorize('admin'),
  createCategoryValidator,
  validate,
  ctrl.create
);

router.put(
  '/:id',
  auth,
  authorize('admin'),
  updateCategoryValidator,
  validate,
  ctrl.update
);

router.delete(
  '/:id',
  auth,
  authorize('admin'),
  ctrl.delete
);

module.exports = router;