import express from "express";

import {
  getDocumentsController,
  uploadDocumentController,
  deleteDocumentController,
} from "../controller/documentController.js";

import { createMulter } from "../middlewares/multer.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const upload = createMulter("documents");

router.get("/", authMiddleware, getDocumentsController);

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadDocumentController,
);

router.delete("/:id", authMiddleware, deleteDocumentController);

export default router;