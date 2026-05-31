const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const {
    registerValidator,
    loginValidator,
    refreshValidator,
} = require('../validators/auth.validator');

// Public
router.post('/register', registerValidator, validate, ctrl.register);
router.post('/login', loginValidator, validate, ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/refresh', refreshValidator, validate, ctrl.refresh);

// Protégé
router.get('/me', auth, ctrl.me);

module.exports = router;