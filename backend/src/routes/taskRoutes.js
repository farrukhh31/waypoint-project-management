const router = require('express').Router();
const taskController = require('../controllers/taskController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createTaskSchema,
  updateTaskSchema,
  rescheduleTaskSchema,
  updateStatusSchema,
  submitTaskSchema,
  reviewDecisionSchema,
  idParamSchema,
} = require('../validators/taskValidators');

router.use(authenticate);

router.get('/', taskController.listTasks);
router.get('/timeline', taskController.getTimeline);
router.post('/', requireRole('ADMIN', 'PROJECT_MANAGER'), validate({ body: createTaskSchema }), taskController.createTask);
router.get('/:id', validate({ params: idParamSchema }), taskController.getTask);
router.patch(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate({ params: idParamSchema, body: updateTaskSchema }),
  taskController.updateTask
);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateStatusSchema }),
  taskController.updateStatus
);
// Assignee submits their work for the owning Project Manager's review.
router.post('/:id/submit', validate({ params: idParamSchema, body: submitTaskSchema }), taskController.submitTask);
// Assignee withdraws their own pending (undecided) submission.
router.post('/:id/submit/undo', validate({ params: idParamSchema }), taskController.undoSubmitTask);
// Owning PM only (not Admin) — approve or request changes on a submitted task.
router.post(
  '/:id/review',
  requireRole('PROJECT_MANAGER'),
  validate({ params: idParamSchema, body: reviewDecisionSchema }),
  taskController.reviewTask
);
// Owning PM, or an Admin as an override — undo the most recent review
// decision and send the task back to REVIEW so it can be reconsidered.
router.post(
  '/:id/review/undo',
  requireRole('PROJECT_MANAGER', 'ADMIN'),
  validate({ params: idParamSchema }),
  taskController.undoTaskReview
);
router.patch(
  '/:id/reschedule',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate({ params: idParamSchema, body: rescheduleTaskSchema }),
  taskController.rescheduleTask
);
router.delete('/:id', requireRole('ADMIN', 'PROJECT_MANAGER'), validate({ params: idParamSchema }), taskController.deleteTask);

module.exports = router;
