import {
  createConversation,
  getUserConversation,
  getConversation,
  deleteConversation,
} from "../controller/conversationController.js";
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import tenantMiddleware from "../middlewares/tenantMiddleware.js"
const router = express.Router();

router.post("/", authMiddleware, tenantMiddleware, createConversation);
router.get("/", authMiddleware, tenantMiddleware, getUserConversation);
router.get("/:conversationId", authMiddleware, tenantMiddleware, getConversation);
router.delete("/:conversationId", authMiddleware, tenantMiddleware, deleteConversation);

export default router;
