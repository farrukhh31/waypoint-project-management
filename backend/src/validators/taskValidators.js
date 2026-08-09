const { z } = require('zod');
const { attachmentSchema, linkSchema } = require('./discussionValidators');

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const createTaskSchema = z
  .object({
    title: z.string().min(2).max(200),
    description: z.string().max(5000).optional().default(''),
    projectId: z.string().min(1),
    assigneeId: z.string().min(1).optional().nullable(),
    priority: priorityEnum.optional(),
    startDate: z.coerce.date().optional().nullable(),
    dueDate: z.coerce.date(),
    progress: z.coerce.number().int().min(0).max(100).optional(),
    isMilestone: z.coerce.boolean().optional(),
    dependsOnTaskIds: z.array(z.string().min(1)).max(20).optional(),
  })
  .refine((data) => !data.startDate || data.startDate <= data.dueDate, {
    message: 'startDate must be on or before dueDate.',
    path: ['startDate'],
  });

const updateTaskSchema = z
  .object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional(),
    assigneeId: z.string().min(1).optional().nullable(),
    priority: priorityEnum.optional(),
    startDate: z.coerce.date().optional().nullable(),
    dueDate: z.coerce.date().optional(),
    progress: z.coerce.number().int().min(0).max(100).optional(),
    isMilestone: z.coerce.boolean().optional(),
    dependsOnTaskIds: z.array(z.string().min(1)).max(20).optional(),
  })
  .refine((data) => !data.startDate || !data.dueDate || data.startDate <= data.dueDate, {
    message: 'startDate must be on or before dueDate.',
    path: ['startDate'],
  });

// Lightweight body for drag-to-reschedule in the Gantt view — just the
// two dates, so a bar-drag doesn't need to resend the whole task.
const rescheduleTaskSchema = z
  .object({
    startDate: z.coerce.date(),
    dueDate: z.coerce.date(),
  })
  .refine((data) => data.startDate <= data.dueDate, {
    message: 'startDate must be on or before dueDate.',
    path: ['startDate'],
  });

// The generic PATCH /tasks/:id/status endpoint only covers day-to-day
// work-in-progress moves. Entering REVIEW happens through the dedicated
// "submit for review" action, and leaving REVIEW (approve -> COMPLETED,
// or request changes -> IN_PROGRESS) happens through the review action —
// both so a comment can be required/attached and so only the right role
// can make that call.
const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS']),
});

// POST /tasks/:id/submit — the assignee's submission. Free-form note plus
// the deliverables: uploaded files (already stored via POST /api/uploads)
// and/or external links (repo, staging URL, design file, etc.).
const submitTaskSchema = z.object({
  comment: z.string().trim().max(3000).optional(),
  attachments: z.array(attachmentSchema).max(10).optional(),
  links: z.array(linkSchema).max(10).optional(),
});

// POST /tasks/:id/review and POST /projects/:id/review share this shape.
// The reviewer can attach their own files/links too (e.g. redlines,
// annotated screenshots) when requesting changes.
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
  createTaskSchema,
  updateTaskSchema,
  rescheduleTaskSchema,
  updateStatusSchema,
  submitTaskSchema,
  reviewDecisionSchema,
  idParamSchema,
};
