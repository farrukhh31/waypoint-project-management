const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// POST /api/uploads — accepts one or more files under the "files" field and
// returns their stored metadata. Callers (task/project submit, comments)
// attach the returned { name, url, size, mimeType } objects to their own
// request rather than uploading inline, so a submission can carry several
// files plus a set of external links in one payload.
const uploadFiles = catchAsync(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) throw ApiError.badRequest('No files were uploaded.');

  const uploaded = files.map((f) => ({
    name: f.originalname,
    // CloudinaryStorage populates f.path with the asset's public secure URL
    // directly — no local /uploads/ prefix needed since the file never
    // touches this server's disk.
    url: f.path,
    size: f.size,
    mimeType: f.mimetype,
  }));

  res.status(201).json({ success: true, message: 'Files uploaded.', data: { files: uploaded } });
});

module.exports = { uploadFiles };
