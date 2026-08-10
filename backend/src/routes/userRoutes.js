const router = require('express').Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { uploadAvatarMiddleware } = require('../middleware/uploadAvatar');
const {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  idParamSchema,
  notificationPreferencesSchema,
  enableTwoFactorSchema,
  disableTwoFactorSchema,
} = require('../validators/userValidators');

router.use(authenticate);

// Self-service (any authenticated role)
router.patch('/me/profile', validate({ body: updateProfileSchema }), userController.updateProfile);
router.patch('/me/password', validate({ body: changePasswordSchema }), userController.changePassword);
router.post('/me/password/email-reset', userController.emailNewPassword);
router.post('/me/avatar', uploadAvatarMiddleware, userController.uploadAvatar);
router.delete('/me/avatar', userController.removeAvatar);
router.post('/me/2fa/setup', userController.setupTwoFactor);
router.post('/me/2fa/enable', validate({ body: enableTwoFactorSchema }), userController.enableTwoFactor);
router.post('/me/2fa/disable', validate({ body: disableTwoFactorSchema }), userController.disableTwoFactor);
router.get('/me/notification-preferences', userController.getNotificationPreferences);
router.patch(
  '/me/notification-preferences',
  validate({ body: notificationPreferencesSchema }),
  userController.updateNotificationPreferences
);
router.get('/assignable', userController.listAssignable);

// Admin-only user management
router.get('/', requireRole('ADMIN'), userController.listUsers);
router.post('/', requireRole('ADMIN'), validate({ body: createUserSchema }), userController.createUser);
router.get(
  '/:id/report',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate({ params: idParamSchema }),
  userController.getUserReport
);
router.get('/:id', requireRole('ADMIN', 'PROJECT_MANAGER'), validate({ params: idParamSchema }), userController.getUser);
router.patch(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateUserSchema }),
  userController.updateUser
);
router.delete('/:id', requireRole('ADMIN'), validate({ params: idParamSchema }), userController.deleteUser);

module.exports = router;
