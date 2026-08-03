import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

    const ok = allowed.some((type) =>
      file.mimetype.startsWith(type)
    );

    if (ok) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

export default upload;