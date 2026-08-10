const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.get('/', dashboardController.getDashboard);
router.get('/activity', requireRole('ADMIN'), dashboardController.getActivityTrend);

module.exports = router;
