const { z } = require('zod');

const startTimeEntrySchema = z.object({
  label: z.string().min(1).max(200),
  projectId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
});

const updateTimeEntrySchema = z.object({
  label: z.string().min(1).max(200).optional(),
  projectId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

module.exports = { startTimeEntrySchema, updateTimeEntrySchema, idParamSchema };
