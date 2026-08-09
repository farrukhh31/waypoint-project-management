const router = require('express').Router({ mergeParams: true });
const discussionController = require('../controllers/discussionController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { createMessageSchema, idParamSchema } = require('../validators/discussionValidators');

// Mounted at /api/tasks/:id/discussions
router.use(authenticate);

router.get('/', validate({ params: idParamSchema }), discussionController.listMessages);
router.post('/', validate({ params: idParamSchema, body: createMessageSchema }), discussionController.addMessage);

module.exports = router;
