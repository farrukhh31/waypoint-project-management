const ApiError = require('../utils/ApiError');

// Usage: requireRole('ADMIN'), requireRole('ADMIN', 'PROJECT_MANAGER')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}.`
        )
      );
    }
    next();
  };
}

module.exports = { requireRole };
