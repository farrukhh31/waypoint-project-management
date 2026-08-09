const router = require('express').Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// multipart/form-data, field name "files" (supports multiple)
router.post('/', upload.array('files', 10), uploadController.uploadFiles);

module.exports = router;
