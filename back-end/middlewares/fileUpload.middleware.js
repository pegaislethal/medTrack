const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `medicine-${unique}${ext}`);
  },
});

// File Filter (Images Only)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const extOK = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOK = allowed.test(file.mimetype);

  if (extOK && mimeOK) cb(null, true);
  else cb(new Error("Only image files (jpg, jpeg, png, gif) allowed!"));
};

// Upload Handler
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,                  // Max 5 images
  },
}).array("image", 5);

// Wrapper Middleware
const uploadMultiple = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Each image must be under 5MB.",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Max 5 images allowed.",
        });
      }
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Image is optional, so we don't require files
    // If files exist, they will be available in req.files

    next();
  });
};

module.exports = uploadMultiple;
