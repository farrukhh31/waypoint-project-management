const bcrypt = require('bcryptjs');
const { User, RefreshToken } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { BCRYPT_SALT_ROUNDS } = require('../config/security');
const { verifyTOTP } = require('../utils/totp');
const { consumeBackupCode } = require('../utils/backupCodes');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signMfaToken,
  verifyMfaToken,
  expiryToMs,
} = require('../utils/jwt');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
};

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
};

async function issueTokens(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + expiryToMs(process.env.JWT_REFRESH_EXPIRES)),
  });

  res.cookie('refreshToken', refreshToken, {
    ...REFRESH_COOKIE_OPTS,
    maxAge: expiryToMs(process.env.JWT_REFRESH_EXPIRES),
  });

  return accessToken;
}

// GET /api/auth/bootstrap-status — lets the frontend know, before rendering
// anything, whether this is a brand-new install (show the "create your
// workspace" form) or an established one (public signup is closed; direct
// people to an invite link instead).
const bootstrapStatus = catchAsync(async (req, res) => {
  const userCount = await User.count();
  res.json({ success: true, data: { bootstrapNeeded: userCount === 0 } });
});

// Public self-registration only ever works once: it creates the very first
// account (the workspace's Administrator) on an empty system. Every account
// after that — at any role, including future Admins — is created by an
// existing Administrator sending an invite (see inviteController), never by
// someone landing on a public form. This mirrors how real PM SaaS platforms
// (Linear, Notion, Asana) bootstrap a workspace.
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const userCount = await User.count();
  if (userCount > 0) {
    throw ApiError.forbidden(
      'Public registration is closed. Ask an administrator to send you an invite.'
    );
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: 'ADMIN' });

  const accessToken = await issueTokens(user, res);
  res.status(201).json({
    success: true,
    message: 'Workspace created — you are the Administrator.',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password.');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password.');

  // The portal picked on the login screen is checked only after the password
  // has already proven the credentials are correct — so this can never be
  // used to probe which role an email belongs to. The user's actual role
  // always comes from the database, never from this field.
  if (role && role !== user.role) {
    throw ApiError.unauthorized(
      `This account is not registered as a ${ROLE_LABEL[role]}. Pick the correct portal and try again.`
    );
  }

  if (user.twoFactorEnabled) {
    // Password checked out, but a second factor is required before we hand
    // out real tokens. The frontend collects a code and calls /verify-2fa.
    return res.json({
      success: true,
      message: 'Enter your two-factor code to finish signing in.',
      data: { requiresTwoFactor: true, mfaToken: signMfaToken(user) },
    });
  }

  const accessToken = await issueTokens(user, res);
  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

// POST /api/auth/verify-2fa — second step of login for accounts with 2FA on.
// Accepts either a live 6-digit authenticator code or a one-time backup code.
const verifyTwoFactor = catchAsync(async (req, res) => {
  const { mfaToken, code } = req.body;

  let payload;
  try {
    payload = verifyMfaToken(mfaToken);
  } catch {
    throw ApiError.unauthorized('That took too long — please sign in again.');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive || !user.twoFactorEnabled) {
    throw ApiError.unauthorized('Please sign in again.');
  }

  const validTotp = verifyTOTP(code, user.twoFactorSecret);
  const validBackup = !validTotp && (await consumeBackupCode(user, code));
  if (!validTotp && !validBackup) throw ApiError.unauthorized('Invalid or expired code.');

  const accessToken = await issueTokens(user, res);
  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token provided.');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Refresh token invalid or expired. Please log in again.');
  }

  const stored = await RefreshToken.findOne({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token invalid or expired. Please log in again.');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or deactivated.');

  // Rotate refresh token
  await stored.destroy();
  const accessToken = await issueTokens(user, res);

  res.json({ success: true, data: { user: user.toSafeJSON(), accessToken } });
});

const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await RefreshToken.destroy({ where: { token } });
  }
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
  res.json({ success: true, message: 'Logged out successfully.' });
});

const me = catchAsync(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

module.exports = { register, login, verifyTwoFactor, refresh, logout, me, bootstrapStatus };