const { body } = require('express-validator');

const createCommentValidator = [
  body('articleId')
    .notEmpty().withMessage('Article ID is required')
    .isString().withMessage('Article ID must be a string'),

  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 2, max: 2000 })
    .withMessage('Content must be between 2 and 2000 characters'),

  body('parentId')
    .optional()
    .isString().withMessage('Parent ID must be a string'),
];

const updateCommentValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 2, max: 2000 })
    .withMessage('Content must be between 2 and 2000 characters'),
];

module.exports = { createCommentValidator, updateCommentValidator };