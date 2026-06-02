const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const ApiError = require('../utils/ApiError');

function createStorage(folder) {
  const dest = path.join(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename:    (req, file, cb) => {
      const ext      = path.extname(file.originalname).toLowerCase();
      const filename = `${folder}-${req.user.id}-${Date.now()}${ext}`;
      cb(null, filename);
    },
  });
}

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only JPEG, PNG and WebP images are allowed'), false);
  }
}

const uploadAvatar = multer({
  storage:  createStorage('avatars'),
  limits:   { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter,
});

const uploadCover = multer({
  storage:  createStorage('covers'),
  limits:   { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = { uploadAvatar, uploadCover };