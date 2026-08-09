const router = require('express').Router();
const timeEntryController = require('../controllers/timeEntryController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { startTimeEntrySchema, idParamSchema } = require('../validators/timeEntryValidators');

router.use(authenticate);

router.get('/active', timeEntryController.getActive);
router.get('/', timeEntryController.listEntries);
router.post('/start', validate({ body: startTimeEntrySchema }), timeEntryController.startEntry);
router.post('/:id/pause', validate({ params: idParamSchema }), timeEntryController.pauseEntry);
router.post('/:id/resume', validate({ params: idParamSchema }), timeEntryController.resumeEntry);
router.post('/:id/stop', validate({ params: idParamSchema }), timeEntryController.stopEntry);

module.exports = router;
