import express from "express";

import authRoutes from "./authRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import messageRoutes from "./messageRoutes.js";
import documentRoutes from "./documentRoutes.js";
import tenantRoutes from "./tenantRoutes.js";
import invitationRoutes from "./invitationRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/conversations", conversationRoutes);

router.use("/messages", messageRoutes);

router.use("/documents", documentRoutes);

router.use("/tenants", tenantRoutes);

router.use("/tenants", tenantRoutes);

router.use("/invitations", invitationRoutes);

export default router;
