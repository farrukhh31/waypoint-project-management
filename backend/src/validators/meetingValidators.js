const { z } = require('zod');

const urlOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\//i.test(v), { message: 'Must be a valid URL' })
  .optional()
  .nullable();

const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  meetingLink: urlOrEmpty,
  color: z.string().max(30).optional().nullable(),
  attendeeIds: z.array(z.string().min(1)).max(200).optional(),
});

const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  meetingLink: urlOrEmpty,
  color: z.string().max(30).optional().nullable(),
  status: z.enum(['SCHEDULED', 'CANCELLED']).optional(),
  attendeeIds: z.array(z.string().min(1)).max(200).optional(),
});

const reminderSchema = z.object({
  reminderEnabled: z.boolean().optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

module.exports = { createMeetingSchema, updateMeetingSchema, reminderSchema, idParamSchema };
