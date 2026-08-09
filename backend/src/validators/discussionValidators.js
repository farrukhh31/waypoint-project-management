const { z } = require('zod');

// A file already uploaded via POST /api/uploads — the client sends back
// what that endpoint returned, not the raw file, so a comment/submission
// payload stays plain JSON.
const attachmentSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().min(1).max(2000),
  size: z.number().nonnegative().optional(),
  mimeType: z.string().max(255).optional(),
});

// An external reference (Drive, GitHub, Figma, staging URL, etc.).
const linkSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().url().max(2000),
});

const createMessageSchema = z
  .object({
    message: z.string().max(2000).default(''),
    attachments: z.array(attachmentSchema).max(10).optional(),
    links: z.array(linkSchema).max(10).optional(),
  })
  .refine(
    (data) => data.message.trim().length > 0 || (data.attachments?.length ?? 0) > 0 || (data.links?.length ?? 0) > 0,
    { message: 'Add a message, a file, or a link.', path: ['message'] }
  );

const idParamSchema = z.object({ id: z.string().min(1) });

module.exports = { createMessageSchema, attachmentSchema, linkSchema, idParamSchema };
