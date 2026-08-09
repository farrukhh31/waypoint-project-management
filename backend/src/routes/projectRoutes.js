const router = require('express').Router();
const projectController = require('../controllers/projectController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createProjectSchema,
  updateProjectSchema,
  memberIdsSchema,
  submitProjectSchema,
  reviewDecisionSchema,
  idParamSchema,
} = require('../validators/projectValidators');

router.use(authenticate);

router.get('/', projectController.listProjects);
router.post('/', requireRole('ADMIN'), validate({ body: createProjectSchema }), projectController.createProject);
router.get('/:id', validate({ params: idParamSchema }), projectController.getProject);
router.patch(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate({ params: idParamSchema, body: updateProjectSchema }),
  projectController.updateProject
);
// Owning PM submits the project (once all tasks are done) for Admin approval.
router.post(
  '/:id/submit',
  requireRole('PROJECT_MANAGER'),
  validate({ params: idParamSchema, body: submitProjectSchema }),
  projectController.submitProject
);
// Owning PM withdraws their own pending (undecided) submission.
router.post(
  '/:id/submit/undo',
  requireRole('PROJECT_MANAGER'),
  validate({ params: idParamSchema }),
  projectController.undoSubmitProject
);
// Admin only (not PM) — approve or request changes on a submitted project.
router.post(
  '/:id/review',
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: reviewDecisionSchema }),
  projectController.reviewProject
);
// Admin only — undo the most recent approve/request-changes decision and
// send the project back to PENDING_APPROVAL so it can be reconsidered.
router.post(
  '/:id/review/undo',
  requireRole('ADMIN'),
  validate({ params: idParamSchema }),
  projectController.undoProjectReview
);
router.delete('/:id', requireRole('ADMIN'), validate({ params: idParamSchema }), projectController.deleteProject);

router.post(
  '/:id/members',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validate({ params: idParamSchema, body: memberIdsSchema }),
  projectController.addMembers
);
router.delete(
  '/:id/members/:userId',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  projectController.removeMember
);

module.exports = router;
