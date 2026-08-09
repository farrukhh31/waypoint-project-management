const router = require('express').Router();
const meetingController = require('../controllers/meetingController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { createMeetingSchema, updateMeetingSchema, idParamSchema } = require('../validators/meetingValidators');

router.use(authenticate);

router.get('/today', meetingController.listToday);
router.get('/', meetingController.listMeetings);
router.post('/', validate({ body: createMeetingSchema }), meetingController.createMeeting);
router.patch('/:id', validate({ params: idParamSchema, body: updateMeetingSchema }), meetingController.updateMeeting);
router.delete('/:id', validate({ params: idParamSchema }), meetingController.deleteMeeting);

module.exports = router;
