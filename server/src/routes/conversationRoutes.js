import {
  createConversation,
  getUserConversation,
  getConversation,
  deleteConversation,
} from "../controller/conversationController.js";
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createConversation);
router.get("/", authMiddleware, getUserConversation);
router.get("/:conversationId", authMiddleware, getConversation);
router.delete("/:conversationId", authMiddleware, deleteConversation);

export default router;
