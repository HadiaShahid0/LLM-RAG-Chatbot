import express from "express";

import {
  createMessage,
  getMessagesByConversationId,
  getMessageById,
  regenerateMessage,
} from "../controller/messageController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import tenantMiddleware from "../middlewares/tenantMiddleware.js";
import { createMulter } from "../middlewares/multer.js";

const upload = createMulter("chat");
const router = express.Router();

router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  upload.single("file"),
  createMessage,
);

router.get(
  "/conversations/:conversationId",
  authMiddleware,
  tenantMiddleware,
  getMessagesByConversationId,
);

router.get("/:messageId", authMiddleware, tenantMiddleware, getMessageById);

router.post(
  "/:messageId/regenerate",
  authMiddleware,
  tenantMiddleware,
  regenerateMessage,
);

export default router;
