const ApiError = require('../utils/ApiError');

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) return next(ApiError.unauthorized());
        if (!roles.includes(req.user.role))
            return next(ApiError.forbidden(`Role '${req.user.role}' is not allowed`));
        next();
    };
}

module.exports = authorize;