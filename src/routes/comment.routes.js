const router    = require('express').Router();
const ctrl      = require('../controllers/comment.controller');
const auth      = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validate  = require('../middlewares/validate.middleware');
const {
  createCommentValidator,
  updateCommentValidator,
} = require('../validators/comment.validator');

// ── Public ────────────────────────────────────────────────────
router.get(
  '/article/:articleId',
  ctrl.getByArticle
);

// ── Admin — modération ────────────────────────────────────────
router.get(
  '/pending',
  auth,
  authorize('admin'),
  ctrl.getPending
);

router.patch(
  '/:id/approve',
  auth,
  authorize('admin'),
  ctrl.approve
);

router.patch(
  '/:id/reject',
  auth,
  authorize('admin'),
  ctrl.reject
);

// ── Connecté ──────────────────────────────────────────────────
router.post(
  '/',
  auth,
  createCommentValidator,
  validate,
  ctrl.create
);

router.put(
  '/:id',
  auth,
  updateCommentValidator,
  validate,
  ctrl.update
);

router.delete(
  '/:id',
  auth,
  ctrl.delete
);

module.exports = router;