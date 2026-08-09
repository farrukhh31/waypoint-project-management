const { z } = require('zod');
const { emailField, strongPassword } = require('./authValidators');

const roleEnum = z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']);

const createInviteSchema = z.object({
  email: emailField,
  role: roleEnum,
  // Required when a Project Manager sends the invite (scopes it to their
  // project); optional/ignored context for Admin-sent invites. Further
  // enforcement (role must be TEAM_MEMBER, project must be theirs) happens
  // in the controller, where req.user is available.
  projectId: z.string().uuid('projectId must be a valid id').optional(),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  password: strongPassword,
});

const tokenParamSchema = z.object({ token: z.string().min(1) });
const idParamSchema = z.object({ id: z.string().min(1) });

module.exports = { createInviteSchema, acceptInviteSchema, tokenParamSchema, idParamSchema };