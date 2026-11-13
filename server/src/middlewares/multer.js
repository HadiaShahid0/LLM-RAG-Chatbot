import multer from "multer";
import path from "path";
import fs from "fs";

export const createMulter = (folderName) => {
  const uploadPath = path.resolve("src/uploads", folderName);

  // Create directory if it doesn't exist
  fs.mkdirSync(uploadPath, { recursive: true });

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadPath);
    },

    filename(req, file, cb) {
      const uniqueName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname).toLowerCase();

      cb(null, uniqueName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" &&
      path.extname(file.originalname).toLowerCase() === ".pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });
};
