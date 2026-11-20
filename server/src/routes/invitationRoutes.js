import express from "express";

import {
  createInvitationController,
  getInvitationsController,
  resendInvitationController,
  revokeInvitationController,
  validateInvitationController,
  acceptInvitationController,
  acceptExistingInvitationController,
} from "../controller/invitationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import tenantMiddleware from "../middlewares/tenantMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, tenantMiddleware, createInvitationController);

router.get("/", authMiddleware, tenantMiddleware, getInvitationsController);
router.post(
  "/:id/resend",
  authMiddleware,
  tenantMiddleware,
  resendInvitationController,
);

router.patch(
  "/:id/revoke",
  authMiddleware,
  tenantMiddleware,
  revokeInvitationController,
);
// Public invitation validation
router.get("/validate/:token", validateInvitationController);

// Public registration for new employees
router.post("/accept", acceptInvitationController);

// Existing authenticated users
router.post(
  "/accept-existing",
  authMiddleware,
  acceptExistingInvitationController,
);
export default router;
