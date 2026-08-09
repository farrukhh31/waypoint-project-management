const router = require('express').Router({ mergeParams: true });
const projectDiscussionController = require('../controllers/projectDiscussionController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { createMessageSchema, idParamSchema } = require('../validators/discussionValidators');

// Mounted at /api/projects/:id/discussions
router.use(authenticate);

router.get('/', validate({ params: idParamSchema }), projectDiscussionController.listMessages);
router.post('/', validate({ params: idParamSchema, body: createMessageSchema }), projectDiscussionController.addMessage);

module.exports = router;
