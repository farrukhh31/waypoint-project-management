const { z } = require('zod');
const { emailField, strongPassword } = require('./authValidators');
const { NOTIFICATION_TYPES } = require('../config/notificationTypes');

const roleEnum = z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']);

const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: emailField,
  password: strongPassword,
  role: roleEnum.optional(),
  jobTitle: z.string().max(100).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: emailField.optional(),
  role: roleEnum.optional(),
  jobTitle: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  phone: z.string().max(30).optional(),
  linkedinUrl: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(280).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: emailField.optional(),
  // Only required/checked (in the controller) when email is actually
  // changing — re-confirming identity before touching the login credential.
  currentPassword: z.string().optional(),
  jobTitle: z.string().max(100).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  phone: z.string().max(30).optional(),
  linkedinUrl: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(280).optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: strongPassword,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

const idParamSchema = z.object({ id: z.string().min(1) });

const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  mutedNotificationTypes: z.array(z.enum(NOTIFICATION_TYPES)).optional(),
});

const twoFactorCodeSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app');

const enableTwoFactorSchema = z.object({
  code: twoFactorCodeSchema,
});

const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Enter your current password'),
  // Accepts either a live 6-digit code or an XXXXX-XXXXX backup code.
  code: z.string().min(6).max(11),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  idParamSchema,
  notificationPreferencesSchema,
  enableTwoFactorSchema,
  disableTwoFactorSchema,
};
