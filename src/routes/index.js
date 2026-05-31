const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/articles', require('./article.routes'));
router.use('/categories', require('./category.routes'));
router.use('/tags', require('./tag.routes'));
router.use('/comments', require('./comment.routes'));

router.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

module.exports = router;