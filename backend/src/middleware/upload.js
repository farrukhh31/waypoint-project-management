const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Files are uploaded straight to Cloudinary instead of local disk — a
// redeploy or restart on hosts like Render/Railway wipes local disk, which
// would otherwise silently delete every attachment. Callers only ever see
// back a URL (see uploadController.js), so nothing downstream needs to
// change based on where files actually live.
const BLOCKED_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.jar', '.app', '.com', '.scr']);

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const ext = path.extname(file.originalname);
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    return {
      folder: 'pm-platform/attachments',
      public_id: `${Date.now()}-${safeBase}`,
      resource_type: 'auto', // let Cloudinary detect image/video/raw (pdf, docx, zip, etc.)
    };
  },
});

// Block obviously-executable file types outright; everything a team member
// would realistically attach to a submission (docs, images, PDFs, zips,
// spreadsheets, design files) is allowed through.
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
