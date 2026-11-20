import express from "express";

import {
  getDocumentsController,
  uploadDocumentController,
  deleteDocumentController,
} from "../controller/documentController.js";

import { createMulter } from "../middlewares/multer.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import tenantMiddleware from "../middlewares/tenantMiddleware.js";
import { updateDocumentVisibilityController } from "../controller/documentPermissionController.js";
const router = express.Router();

const upload = createMulter("documents");

router.get("/", authMiddleware, tenantMiddleware, getDocumentsController);

router.post(
  "/upload",
  authMiddleware,
  tenantMiddleware,
  upload.single("file"),
  uploadDocumentController,
);

router.delete(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  deleteDocumentController,
);
router.patch(
  "/:id/visibility",
  authMiddleware,
  tenantMiddleware,
  updateDocumentVisibilityController,
);
export default router;
