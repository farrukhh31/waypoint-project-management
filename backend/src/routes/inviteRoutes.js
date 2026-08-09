const router = require('express').Router();
const inviteController = require('../controllers/inviteController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createInviteSchema,
  acceptInviteSchema,
  tokenParamSchema,
  idParamSchema,
} = require('../validators/inviteValidators');

// Public — the person accepting an invite isn't authenticated yet.
router.get('/verify/:token', validate({ params: tokenParamSchema }), inviteController.verifyInvite);
router.post('/accept', validate({ body: acceptInviteSchema }), inviteController.acceptInvite);

// Everything else manages invites. Admins always can; Project Managers can
// too, but only if an Admin has granted them canInviteMembers, and only for
// projects they manage — that check happens in the controller, where
// req.user and the target project are both available.
router.use(authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'));

router.get('/', inviteController.listInvites);
router.post('/', validate({ body: createInviteSchema }), inviteController.createInvite);
router.post('/:id/resend', validate({ params: idParamSchema }), inviteController.resendInvite);
router.delete('/:id', validate({ params: idParamSchema }), inviteController.revokeInvite);

module.exports = router;