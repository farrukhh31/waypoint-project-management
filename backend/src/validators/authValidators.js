const { z } = require('zod');

// Emails are case-insensitive by spec (and Postgres' unique index is case-sensitive),
// so every entry point normalizes to lowercase before it ever reaches a query.
const emailField = z
  .string()
  .email('Please provide a valid email address')
  .trim()
  .toLowerCase();

// Require at least one lowercase letter, one uppercase letter, and one digit,
// beyond the base length check — meaningfully raises the cost of credential stuffing
// and dictionary attacks without being unreasonably strict on the user.
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[0-9]/, 'Password must include at least one number');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: emailField,
  password: strongPassword,
  // Registration always creates TEAM_MEMBER accounts; admins upgrade roles later.
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
  // Optional: the portal the user picked on the login screen. Purely a UX
  // check — the account's real role in the database is always what's
  // trusted for authorization, never this field. See authController.login.
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});

const verifyTwoFactorSchema = z.object({
  mfaToken: z.string().min(1, 'Missing verification token — please sign in again.'),
  code: z.string().min(6, 'Enter your 6-digit code or a backup code').max(11),
});

module.exports = { registerSchema, loginSchema, refreshSchema, verifyTwoFactorSchema, emailField, strongPassword };