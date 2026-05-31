const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.array().map(e => ({ field: e.path, message: e.msg }));
        return next(ApiError.badRequest('Validation failed', errors));
    }
    next();
}

module.exports = validate;