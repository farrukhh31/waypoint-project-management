const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// Requires a valid access token. Attaches `req.user` (safe, DB-backed) on success.
const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw ApiError.unauthorized('Authentication token missing. Please log in.');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Session expired or invalid. Please log in again.');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account not found or has been deactivated.');
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
