const { body, query, param } = require('express-validator');

const createArticleValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),

  body('content')
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),

  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Excerpt must not exceed 500 characters'),

  body('status')
    .optional()
    .isIn(['draft', 'published']).withMessage('Status must be draft or published'),

  body('categoryIds')
    .optional()
    .isArray().withMessage('categoryIds must be an array'),

  body('tagIds')
    .optional()
    .isArray().withMessage('tagIds must be an array'),
];

const updateArticleValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),

  body('content')
    .optional()
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),

  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Excerpt must not exceed 500 characters'),

  body('categoryIds')
    .optional()
    .isArray().withMessage('categoryIds must be an array'),

  body('tagIds')
    .optional()
    .isArray().withMessage('tagIds must be an array'),
];

const listArticlesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['created_at', 'published_at', 'title']).withMessage('Invalid sortBy value'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

module.exports = { createArticleValidator, updateArticleValidator, listArticlesValidator };