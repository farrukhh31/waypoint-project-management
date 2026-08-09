const jwt = require('jsonwebtoken');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// Short-lived token issued after a correct password when the account has 2FA
// on, proving "this request already passed step one" without yet granting
// access. Reuses JWT_ACCESS_SECRET (no new env var) but is unusable as a real
// access token because of the distinct `purpose` claim + narrow 5-minute life.
function signMfaToken(user) {
  return jwt.sign({ sub: user.id, purpose: 'mfa' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
}

function verifyMfaToken(token) {
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (payload.purpose !== 'mfa') throw new Error('Not an MFA token');
  return payload;
}

// Converts "7d" / "15m" style strings to a millisecond duration for DB expiry storage
function expiryToMs(str) {
  const match = /^(\d+)([smhd])$/.exec(str);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signMfaToken,
  verifyMfaToken,
  expiryToMs,
};
