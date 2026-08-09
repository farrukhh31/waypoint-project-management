const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

// Stored outside src/ so it survives a `git pull` / redeploy that replaces
// the app code. Public URL prefix mirrors the static mount added in app.js.
const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const AVATAR_URL_PREFIX = '/api/uploads/avatars/';

const ALLOWED_MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_EXT[file.mimetype] || path.extname(file.originalname) || '';
    // userId prefix keeps files traceable/groupable; random suffix avoids
    // collisions and stops old cached browser copies from being reused.
    cb(null, `${req.user.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_EXT[file.mimetype]) {
      return cb(ApiError.badRequest('Please upload a JPG, PNG, WEBP, or GIF image.'));
    }
    cb(null, true);
  },
});

module.exports = {
  uploadAvatarMiddleware: upload.single('avatar'),
  AVATAR_DIR,
  AVATAR_URL_PREFIX,
};
