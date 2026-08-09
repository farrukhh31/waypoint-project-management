const { z } = require('zod');
const { attachmentSchema, linkSchema } = require('./discussionValidators');

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
// PENDING_APPROVAL is intentionally excluded here — it can only be entered
// via POST /projects/:id/submit and left via POST /projects/:id/review, so
// it isn't a value a client can set through the generic update endpoint.
const statusEnum = z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);

const createProjectSchema = z
  .object({
    name: z.string().min(2).max(150),
    description: z.string().max(5000).optional().default(''),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    managerId: z.string().min(1, 'A Project Manager must be assigned'),
    memberIds: z.array(z.string()).optional().default([]),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

const updateProjectSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(5000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  managerId: z.string().min(1).optional(),
});

const memberIdsSchema = z.object({
  memberIds: z.array(z.string()).min(1, 'Provide at least one member id'),
});

// POST /projects/:id/submit — the PM's submission for approval, with the
// same deliverables shape as a task submission.
const submitProjectSchema = z.object({
  comment: z.string().trim().max(3000).optional(),
  attachments: z.array(attachmentSchema).max(10).optional(),
  links: z.array(linkSchema).max(10).optional(),
});

// POST /projects/:id/review — shared shape with the task review endpoint.
const reviewDecisionSchema = z
  .object({
    decision: z.enum(['approve', 'request_changes']),
    comment: z.string().trim().max(3000).optional(),
    attachments: z.array(attachmentSchema).max(10).optional(),
    links: z.array(linkSchema).max(10).optional(),
  })
  .refine((data) => data.decision !== 'request_changes' || (data.comment && data.comment.length > 0), {
    message: 'A comment is required when requesting changes.',
    path: ['comment'],
  });

const idParamSchema = z.object({ id: z.string().min(1) });

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  memberIdsSchema,
  submitProjectSchema,
  reviewDecisionSchema,
  idParamSchema,
};
