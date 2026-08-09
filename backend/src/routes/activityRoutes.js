const router = require('express').Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/project/:projectId', activityController.getProjectTimeline);

module.exports = router;
