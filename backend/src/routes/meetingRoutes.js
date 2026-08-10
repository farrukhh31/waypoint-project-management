const router = require('express').Router();
const meetingController = require('../controllers/meetingController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createMeetingSchema,
  updateMeetingSchema,
  reminderSchema,
  idParamSchema,
} = require('../validators/meetingValidators');

router.use(authenticate);

// Fixed/prefixed routes must come before the '/:id' catch-all below.
router.get('/today', meetingController.listToday);
router.get('/upcoming', meetingController.listUpcoming);
router.get('/admin/all', requireRole('ADMIN'), meetingController.listAllMeetings);

router.get('/', meetingController.listMeetings);
router.post('/', requireRole('ADMIN', 'PROJECT_MANAGER'), validate({ body: createMeetingSchema }), meetingController.createMeeting);
router.get('/:id', validate({ params: idParamSchema }), meetingController.getMeeting);
router.patch('/:id', validate({ params: idParamSchema, body: updateMeetingSchema }), meetingController.updateMeeting);
router.patch(
  '/:id/reminder',
  validate({ params: idParamSchema, body: reminderSchema }),
  meetingController.toggleReminder
);
router.delete('/:id', validate({ params: idParamSchema }), meetingController.deleteMeeting);

module.exports = router;
