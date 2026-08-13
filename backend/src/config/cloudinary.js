const cloudinary = require('cloudinary').v2;

// Single configured Cloudinary client shared by both upload middlewares
// (upload.js for task/discussion attachments, uploadAvatar.js for profile
// pictures). Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and
// CLOUDINARY_API_SECRET to be set — see .env.example. Using Cloudinary
// instead of local disk storage means uploaded files survive redeploys on
// hosts with an ephemeral filesystem (Render, Railway, etc.).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
