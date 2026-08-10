const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { User, Task, Project, ProjectMember, ActivityLog, RefreshToken } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { buildSort, containsInsensitive, paginationParams, paginationMeta } = require('../utils/queryHelpers');
const { BCRYPT_SALT_ROUNDS } = require('../config/security');
const { AVATAR_DIR, AVATAR_URL_PREFIX } = require('../middleware/uploadAvatar');
const { sendMail } = require('../services/mailService');
const { generateSecret, verifyTOTP, buildOtpAuthUri } = require('../utils/totp');
const { consumeBackupCode } = require('../utils/backupCodes');

// Best-effort cleanup of a previously-uploaded avatar file when it's replaced
// or removed. Never throws — a stray orphaned file on disk is harmless, but
// failing the request over a delete error would not be.
function deleteLocalAvatarFile(avatarUrl) {
  if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith(AVATAR_URL_PREFIX)) return;
  const filePath = path.join(AVATAR_DIR, path.basename(avatarUrl));
  fs.unlink(filePath, () => {});
}

const USER_SORT_FIELDS = ['createdAt', 'name', 'email', 'role'];

// GET /api/users?search=&role=&isActive=&sortBy=&order=&page=&limit=
const listUsers = catchAsync(async (req, res) => {
  const { search, role, isActive, sortBy, order, page, limit } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [{ name: containsInsensitive(search) }, { email: containsInsensitive(search) }];
  }
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const { limit: limitNum, offset, page: pageNum } = paginationParams(page, limit);

  const { rows, count } = await User.findAndCountAll({
    where,
    order: buildSort(sortBy, order, USER_SORT_FIELDS, 'createdAt'),
    limit: limitNum,
    offset,
  });

  res.json({
    success: true,
    data: {
      users: rows.map((u) => u.toSafeJSON()),
      pagination: paginationMeta(pageNum, limitNum, count),
    },
  });
});

// GET /api/users/:id — Admin can view anyone. A Project Manager can only
// view someone who's actually a member of one of their own projects (the
// My Team roster) or their own record — never an arbitrary org-wide id.
const getUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  if (req.user.role === 'PROJECT_MANAGER' && req.user.id !== user.id) {
    const managedProjectIds = (await Project.findAll({ where: { managerId: req.user.id }, attributes: ['id'] })).map(
      (p) => p.id
    );
    const isOnTeam = managedProjectIds.length
      ? await ProjectMember.findOne({ where: { userId: user.id, projectId: { [Op.in]: managedProjectIds } } })
      : null;
    if (!isOnTeam) throw ApiError.forbidden('You can only view profiles of people on your own projects.');
  }

  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

// Admin creates a user directly with any role (skips self-registration flow)
const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role, jobTitle } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('A user with this email already exists.');

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'TEAM_MEMBER',
    jobTitle,
  });

  res.status(201).json({ success: true, message: 'User created.', data: { user: user.toSafeJSON() } });
});

const updateUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  if (req.body.email && req.body.email !== user.email) {
    const existing = await User.findOne({ where: { email: req.body.email } });
    if (existing) throw ApiError.conflict('That email is already in use.');
  }

  await user.update(req.body);
  res.json({ success: true, message: 'User updated.', data: { user: user.toSafeJSON() } });
});

const deleteUser = catchAsync(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  await user.destroy();
  res.json({ success: true, message: 'User deleted.' });
});

// Self-service profile update (any authenticated user). Changing the email
// itself requires the current password, since email doubles as the login
// credential — everything else (name, jobTitle, etc.) doesn't.
const updateProfile = catchAsync(async (req, res) => {
  const { email, currentPassword, ...rest } = req.body;

  if (email && email !== req.user.email) {
    if (!currentPassword) {
      throw ApiError.badRequest('Enter your current password to change your email.');
    }
    const validPassword = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!validPassword) throw ApiError.badRequest('Current password is incorrect.');

    const existing = await User.findOne({ where: { email } });
    if (existing) throw ApiError.conflict('That email is already in use.');

    rest.email = email;
  }

  await req.user.update(rest);
  res.json({ success: true, message: 'Profile updated.', data: { user: req.user.toSafeJSON() } });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect.');

  req.user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await req.user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
});

// Generates a random password meeting the same strength rules as everywhere
// else (upper/lower/digit, 14 chars) using crypto.randomInt (CSPRNG), not Math.random.
function generateRandomPassword(length = 14) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O — avoids look-alike confusion
  const lower = 'abcdefghijkmnpqrstuvwxyz'; // no l
  const digits = '23456789'; // no 0/1
  const all = upper + lower + digits;
  const pick = (set) => set[crypto.randomInt(set.length)];

  const required = [pick(upper), pick(lower), pick(digits)];
  const rest = Array.from({ length: length - required.length }, () => pick(all));
  const chars = [...required, ...rest];

  // Fisher–Yates shuffle so the guaranteed characters aren't always up front
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// POST /api/users/me/password/email-reset — "I know my email but not my
// password" self-service, for someone who's still logged in on this device.
// Generates a brand-new password, emails it, and — since the person no
// longer knows their password — signs out every session (including this
// one) so they have to log back in with it.
const emailNewPassword = catchAsync(async (req, res) => {
  const newPassword = generateRandomPassword();
  req.user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await req.user.save();
  await RefreshToken.destroy({ where: { userId: req.user.id } });

  await sendMail({
    to: req.user.email,
    subject: 'Your new Waypoint password',
    text: `Hi ${req.user.name},

Here is your new temporary password:

${newPassword}

Sign in with it, then set something memorable from Profile > Security.

If you didn't request this, contact your administrator right away.`,
  });

  res.json({ success: true, message: `A new password was emailed to ${req.user.email}. You've been signed out everywhere.` });
});

// POST /api/users/me/avatar (multipart/form-data, field name "avatar") —
// uploaded via uploadAvatarMiddleware, which populates req.file.
const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file was uploaded.');

  const previousAvatarUrl = req.user.avatarUrl;
  req.user.avatarUrl = `${AVATAR_URL_PREFIX}${req.file.filename}`;
  await req.user.save();
  deleteLocalAvatarFile(previousAvatarUrl);

  res.json({ success: true, message: 'Photo updated.', data: { user: req.user.toSafeJSON() } });
});

const removeAvatar = catchAsync(async (req, res) => {
  const previousAvatarUrl = req.user.avatarUrl;
  req.user.avatarUrl = null;
  await req.user.save();
  deleteLocalAvatarFile(previousAvatarUrl);

  res.json({ success: true, message: 'Photo removed.', data: { user: req.user.toSafeJSON() } });
});

function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 hex chars
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

// POST /api/users/me/2fa/setup — step 1: generate a secret and hand back the
// manual-entry setup key (grouped for readability) + otpauth URI. Not yet
// "on" — twoFactorEnabled only flips true once the person proves they can
// generate a matching code (see enableTwoFactor).
const setupTwoFactor = catchAsync(async (req, res) => {
  if (req.user.twoFactorEnabled) {
    throw ApiError.badRequest('Two-factor authentication is already on. Turn it off before setting it up again.');
  }
  const secret = generateSecret();
  req.user.twoFactorSecret = secret;
  await req.user.save();

  res.json({
    success: true,
    data: { secret, otpauthUri: buildOtpAuthUri({ secret, accountName: req.user.email }) },
  });
});

// POST /api/users/me/2fa/enable — step 2: confirm setup with a live code.
// On success, returns one-time backup codes (plaintext) — this is the only
// moment they're ever visible; only bcrypt hashes are stored after this.
const enableTwoFactor = catchAsync(async (req, res) => {
  if (!req.user.twoFactorSecret) {
    throw ApiError.badRequest('Start setup first before confirming a code.');
  }
  if (!verifyTOTP(req.body.code, req.user.twoFactorSecret)) {
    throw ApiError.badRequest('That code is incorrect or has expired. Please try again.');
  }

  const backupCodes = generateBackupCodes();
  req.user.twoFactorEnabled = true;
  req.user.twoFactorBackupCodes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, BCRYPT_SALT_ROUNDS)));
  await req.user.save();

  res.json({
    success: true,
    message: 'Two-factor authentication is now on.',
    data: { backupCodes },
  });
});

// POST /api/users/me/2fa/disable — requires the current password AND a valid
// code (live or backup), so a hijacked-but-unlocked session alone can't turn
// this protection off.
const disableTwoFactor = catchAsync(async (req, res) => {
  const { password, code } = req.body;

  const validPassword = await bcrypt.compare(password, req.user.passwordHash);
  if (!validPassword) throw ApiError.badRequest('Current password is incorrect.');

  const validTotp = verifyTOTP(code, req.user.twoFactorSecret);
  const validBackup = !validTotp && (await consumeBackupCode(req.user, code));
  if (!validTotp && !validBackup) throw ApiError.badRequest('That code is incorrect.');

  req.user.twoFactorEnabled = false;
  req.user.twoFactorSecret = null;
  req.user.twoFactorBackupCodes = [];
  await req.user.save();

  res.json({ success: true, message: 'Two-factor authentication turned off.' });
});

// Self-service notification preferences (any authenticated user)
const getNotificationPreferences = catchAsync(async (req, res) => {
  const { emailNotifications, mutedNotificationTypes } = req.user;
  res.json({ success: true, data: { emailNotifications, mutedNotificationTypes } });
});

const updateNotificationPreferences = catchAsync(async (req, res) => {
  await req.user.update(req.body);
  const { emailNotifications, mutedNotificationTypes } = req.user;
  res.json({
    success: true,
    message: 'Notification preferences updated.',
    data: { emailNotifications, mutedNotificationTypes },
  });
});

// Lightweight list for dropdowns (assign PM, add members, assign task) — any authenticated user
const listAssignable = catchAsync(async (req, res) => {
  const { role } = req.query;
  const where = { isActive: true };
  if (role) where.role = role;
  const users = await User.findAll({
    where,
    attributes: ['id', 'name', 'email', 'role', 'avatarUrl', 'jobTitle'],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data: { users } });
});

// GET /api/users/:id/report — per-member progress report for Admin/PM:
// task breakdown, completion rate, recently completed work, and a raw
// activity feed of everything this person has done.
const getUserReport = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  const tasks = await Task.findAll({
    where: { assigneeId: user.id },
    include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
    order: [['updatedAt', 'DESC']],
  });

  const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
  const now = new Date();
  let overdue = 0;
  tasks.forEach((t) => {
    counts[t.status] = (counts[t.status] || 0) + 1;
    if (t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now) overdue += 1;
  });
  const completionRate = tasks.length ? Math.round((counts.COMPLETED / tasks.length) * 100) : 0;
  const recentCompleted = tasks.filter((t) => t.status === 'COMPLETED').slice(0, 8);

  const activity = await ActivityLog.findAll({
    where: { userId: user.id },
    include: [
      { model: Task, attributes: ['id', 'title'] },
      { model: Project, attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 30,
  });

  res.json({
    success: true,
    data: {
      user: user.toSafeJSON(),
      stats: { totalTasks: tasks.length, ...counts, overdue, completionRate },
      recentCompleted,
      activity,
    },
  });
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  emailNewPassword,
  uploadAvatar,
  removeAvatar,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getNotificationPreferences,
  updateNotificationPreferences,
  listAssignable,
  getUserReport,
};
