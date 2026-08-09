const { z } = require('zod');

const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
});

const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional().nullable(),
  reminderEnabled: z.boolean().optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

module.exports = { createMeetingSchema, updateMeetingSchema, idParamSchema };
