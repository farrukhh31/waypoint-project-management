const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, details } = err;

  // Sequelize-specific error normalization
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'A record with this value already exists.';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller.' : 'Could not process the uploaded file.';
  }

  if (!statusCode) statusCode = 500;
  if (!message) message = 'Something went wrong. Please try again.';

  if (statusCode === 500) {
    console.error('[UNHANDLED ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: details || undefined,
  });
}

module.exports = { notFoundHandler, errorHandler };
