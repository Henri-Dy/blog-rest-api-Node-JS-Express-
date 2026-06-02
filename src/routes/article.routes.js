const router      = require('express').Router();
const ctrl        = require('../controllers/article.controller');
const auth        = require('../middlewares/auth.middleware');
const { optionalAuth } = require('../middlewares/auth.middleware');
const authorize   = require('../middlewares/role.middleware');
const validate    = require('../middlewares/validate.middleware');
const { uploadCover } = require('../config/multer');
const {
  createArticleValidator,
  updateArticleValidator,
  listArticlesValidator,
} = require('../validators/article.validator');

// ── Public ────────────────────────────────────────────────────
router.get(
  '/',
  listArticlesValidator,
  validate,
  ctrl.getAll
);

router.get(
  '/my',
  auth,
  authorize('author', 'admin'),
  listArticlesValidator,
  validate,
  ctrl.getMine
);

router.get(
  '/:slug',
  optionalAuth,
  ctrl.getBySlug
);

// ── Protégé ───────────────────────────────────────────────────
router.post(
  '/',
  auth,
  authorize('author', 'admin'),
  createArticleValidator,
  validate,
  ctrl.create
);

router.put(
  '/:id',
  auth,
  authorize('author', 'admin'),
  updateArticleValidator,
  validate,
  ctrl.update
);

router.delete(
  '/:id',
  auth,
  authorize('author', 'admin'),
  ctrl.delete
);

router.patch(
  '/:id/publish',
  auth,
  authorize('author', 'admin'),
  ctrl.publish
);

router.patch(
  '/:id/archive',
  auth,
  authorize('author', 'admin'),
  ctrl.archive
);

router.post(
  '/:id/cover',
  auth,
  authorize('author', 'admin'),
  uploadCover.single('cover'),
  ctrl.updateCover
);

module.exports = router;