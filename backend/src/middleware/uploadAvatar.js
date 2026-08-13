const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const ApiError = require('../utils/ApiError');
const cloudinary = require('../config/cloudinary');

// Avatars go to Cloudinary rather than local disk for the same reason as
// upload.js — local disk on Render/Railway doesn't survive a redeploy.
// req.file.path (populated by CloudinaryStorage) is the public Cloudinary
// URL, and req.file.filename is the Cloudinary public_id — used below by
// userController.js to store/delete the right asset.

const ALLOWED_MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'pm-platform/avatars',
    // userId prefix keeps files traceable/groupable; random suffix avoids
    // collisions and stops old cached browser copies from being reused.
    public_id: `${req.user.id}-${Date.now()}`,
    format: ALLOWED_MIME_EXT[file.mimetype],
    resource_type: 'image',
  }),
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
};
