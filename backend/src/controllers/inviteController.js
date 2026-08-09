const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Invite, RefreshToken, Project, ProjectMember } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { buildSort, containsInsensitive, paginationParams, paginationMeta } = require('../utils/queryHelpers');
const { BCRYPT_SALT_ROUNDS } = require('../config/security');
const { generateInviteToken, hashInviteToken, INVITE_EXPIRY_MS } = require('../utils/inviteToken');
const { signAccessToken, signRefreshToken, expiryToMs } = require('../utils/jwt');
const { sendMail } = require('../services/mailService');
const { randomAvatarUrl } = require('../utils/avatar');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
};

const INVITE_SORT_FIELDS = ['createdAt', 'email', 'role', 'status', 'expiresAt'];

function buildInviteLink(rawToken) {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${base}/accept-invite?token=${rawToken}`;
}

// Sends the invite email through Gmail (see src/services/mailService.js for
// setup). The invite link is still returned in the API response too, so the
// Admin UI can display/copy it as a fallback if mail delivery is slow, fails,
// or Gmail isn't configured in this environment.
async function sendInviteEmail({ email, link, invitedByName }) {
  const subject = "You've been invited to Waypoint";
  const text = `${invitedByName} invited you to join Waypoint.\n\nAccept your invite:\n${link}\n\nThis link will expire soon, so accept it when you can.`;
  const html = `
    <p>${invitedByName} invited you to join <strong>Waypoint</strong>.</p>
    <p><a href="${link}">Accept your invite</a></p>
    <p style="color:#666;font-size:13px;">This link will expire soon, so accept it when you can.<br/>
    If the button doesn't work, copy this link: ${link}</p>
  `;

  try {
    await sendMail({ to: email, subject, text, html });
  } catch (err) {
    // Don't fail the whole request just because email delivery failed — the
    // invite record and link already exist and are shown in the Admin UI.
    console.error(`[inviteController] Failed to send invite email to ${email}:`, err.message);
  }
}

// A Project Manager can only invite people into a project they manage, only
// as TEAM_MEMBER, and only if an Admin has flipped their canInviteMembers
// flag on. Admins are unrestricted. Throws if the request should be denied;
// otherwise returns the Project instance for PM invites (or null for Admin
// invites without a projectId), so the caller can reuse it.
async function assertCanInvite(req) {
  const { role: requestedRole, projectId } = req.body;

  if (req.user.role === 'ADMIN') {
    if (!projectId) return null;
    const project = await Project.findByPk(projectId);
    if (!project) throw ApiError.badRequest('projectId must reference an existing project.');
    return project;
  }

  // req.user.role === 'PROJECT_MANAGER' by this point (route already restricts to ADMIN/PROJECT_MANAGER)
  if (!req.user.canInviteMembers) {
    throw ApiError.forbidden('You do not have permission to invite users. Ask an Administrator to enable it for your account.');
  }
  if (!projectId) {
    throw ApiError.badRequest('projectId is required — you can only invite users into a project you manage.');
  }
  if (requestedRole !== 'TEAM_MEMBER') {
    throw ApiError.forbidden('Project Managers can only invite Team Members.');
  }

  const project = await Project.findByPk(projectId);
  if (!project) throw ApiError.badRequest('projectId must reference an existing project.');
  if (project.managerId !== req.user.id) {
    throw ApiError.forbidden('You can only invite users into projects you manage.');
  }

  return project;
}

// POST /api/invites — Admin, or Project Manager with canInviteMembers (scoped to their own project)
const createInvite = catchAsync(async (req, res) => {
  const { email, role, projectId } = req.body;

  await assertCanInvite(req);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw ApiError.conflict('A user with this email already exists.');

  const existingPending = await Invite.findOne({ where: { email, status: 'PENDING' } });
  if (existingPending && !existingPending.isExpired) {
    throw ApiError.conflict('There is already a pending invite for this email. Resend or revoke it instead.');
  }

  const { raw, hash } = generateInviteToken();
  const invite = await Invite.create({
    email,
    role,
    projectId: projectId || null,
    tokenHash: hash,
    invitedById: req.user.id,
    expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
  });

  const link = buildInviteLink(raw);
  await sendInviteEmail({ email, link, invitedByName: req.user.name });

  res.status(201).json({
    success: true,
    message: 'Invite sent.',
    data: { invite: invite.toSafeJSON(), inviteLink: link },
  });
});

// GET /api/invites?status=&search=&sortBy=&order=&page=&limit= — Admin sees
// all invites; Project Manager sees only invites they sent.
const listInvites = catchAsync(async (req, res) => {
  const { search, status, sortBy, order, page, limit } = req.query;

  const where = {};
  if (search) where.email = containsInsensitive(search);
  if (status) where.status = status;
  if (req.user.role === 'PROJECT_MANAGER') where.invitedById = req.user.id;

  const { limit: limitNum, offset, page: pageNum } = paginationParams(page, limit);

  const { rows, count } = await Invite.findAndCountAll({
    where,
    include: [
      { model: User, as: 'invitedBy', attributes: ['id', 'name'] },
      { model: Project, as: 'project', attributes: ['id', 'name'] },
    ],
    order: buildSort(sortBy, order, INVITE_SORT_FIELDS, 'createdAt'),
    limit: limitNum,
    offset,
  });

  res.json({
    success: true,
    data: {
      invites: rows.map((i) => i.toSafeJSON()),
      pagination: paginationMeta(pageNum, limitNum, count),
    },
  });
});

// POST /api/invites/:id/resend — Admin, or the Project Manager who sent it
const resendInvite = catchAsync(async (req, res) => {
  const invite = await Invite.findByPk(req.params.id);
  if (!invite) throw ApiError.notFound('Invite not found.');
  if (req.user.role === 'PROJECT_MANAGER' && invite.invitedById !== req.user.id) {
    throw ApiError.forbidden('You can only manage invites you sent.');
  }
  if (invite.status !== 'PENDING') {
    throw ApiError.badRequest('Only pending invites can be resent.');
  }

  const { raw, hash } = generateInviteToken();
  invite.tokenHash = hash;
  invite.expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
  await invite.save();

  const link = buildInviteLink(raw);
  await sendInviteEmail({ email: invite.email, link, invitedByName: req.user.name });

  res.json({ success: true, message: 'Invite resent.', data: { invite: invite.toSafeJSON(), inviteLink: link } });
});

// DELETE /api/invites/:id — Admin, or the Project Manager who sent it
// (revoke, not hard-delete — keeps the audit trail)
const revokeInvite = catchAsync(async (req, res) => {
  const invite = await Invite.findByPk(req.params.id);
  if (!invite) throw ApiError.notFound('Invite not found.');
  if (req.user.role === 'PROJECT_MANAGER' && invite.invitedById !== req.user.id) {
    throw ApiError.forbidden('You can only manage invites you sent.');
  }
  if (invite.status !== 'PENDING') {
    throw ApiError.badRequest('Only pending invites can be revoked.');
  }
  invite.status = 'REVOKED';
  await invite.save();
  res.json({ success: true, message: 'Invite revoked.', data: { invite: invite.toSafeJSON() } });
});

// GET /api/invites/verify/:token — Public. Lets the accept-invite page show
// who invited whom and to what role before the person sets a password.
const verifyInvite = catchAsync(async (req, res) => {
  const hash = hashInviteToken(req.params.token);
  const invite = await Invite.findOne({
    where: { tokenHash: hash },
    include: [
      { model: User, as: 'invitedBy', attributes: ['id', 'name'] },
      { model: Project, as: 'project', attributes: ['id', 'name'] },
    ],
  });

  if (!invite || invite.status !== 'PENDING') {
    throw ApiError.notFound('This invite link is invalid or has already been used.');
  }
  if (invite.isExpired) {
    throw ApiError.badRequest('This invite link has expired. Ask an administrator to resend it.');
  }

  res.json({
    success: true,
    data: {
      email: invite.email,
      role: invite.role,
      invitedByName: invite.invitedBy?.name || 'An administrator',
      projectName: invite.project?.name || null,
    },
  });
});

// POST /api/invites/accept — Public. Creates the account and signs the
// person straight in, same shape as /auth/register and /auth/login.
const acceptInvite = catchAsync(async (req, res) => {
  const { token, name, password } = req.body;
  const hash = hashInviteToken(token);

  const invite = await Invite.findOne({ where: { tokenHash: hash } });
  if (!invite || invite.status !== 'PENDING') {
    throw ApiError.notFound('This invite link is invalid or has already been used.');
  }
  if (invite.isExpired) {
    throw ApiError.badRequest('This invite link has expired. Ask an administrator to resend it.');
  }

  const existingUser = await User.findOne({ where: { email: invite.email } });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists. Try signing in instead.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({
    name,
    email: invite.email,
    passwordHash,
    role: invite.role,
    avatarUrl: randomAvatarUrl(invite.email),
  });

  invite.status = 'ACCEPTED';
  invite.acceptedAt = new Date();
  await invite.save();

  // PM-sent invites are scoped to a project — enroll the new user as a
  // member of it immediately, so they don't land in an empty workspace.
  if (invite.projectId) {
    await ProjectMember.findOrCreate({
      where: { projectId: invite.projectId, userId: user.id },
    });
  }

  // Inline (rather than importing authController) to avoid a circular
  // require between the two controllers — issuing tokens is only a few lines.
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

  res.status(201).json({
    success: true,
    message: 'Account created — welcome to Waypoint.',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

module.exports = { createInvite, listInvites, resendInvite, revokeInvite, verifyInvite, acceptInvite };