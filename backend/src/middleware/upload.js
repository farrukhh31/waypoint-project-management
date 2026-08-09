const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Files land in backend/uploads (served statically at /uploads — see app.js).
// Local disk storage is the pragmatic choice for this app's scale; swap the
// `storage` engine for an S3/GCS multer-storage adapter later without
// touching any controller code, since callers only ever see back a URL.
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeBase}${ext}`);
  },
});

// Block obviously-executable file types outright; everything a team member
// would realistically attach to a submission (docs, images, PDFs, zips,
// spreadsheets, design files) is allowed through.
const BLOCKED_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.jar', '.app', '.com', '.scr']);

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type "${ext}" is not allowed.`));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 }, // 25MB per file, up to 10 files per request
});

module.exports = upload;
