const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { registerSchema, loginSchema, refreshSchema, verifyTwoFactorSchema } = require('../validators/authValidators');

router.get('/bootstrap-status', authController.bootstrapStatus);
router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/verify-2fa', validate({ body: verifyTwoFactorSchema }), authController.verifyTwoFactor);
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
