import express from "express";

import {
  getUserTenants,
  selectTenant,
  getTenantEmployees,
} from "../controller/tenantController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import tenantMiddleware  from "../middlewares/tenantMiddleware.js";
import { getDocumentAccessController } from "../controller/documentPermissionController.js";
const router = express.Router();

router.get("/", authMiddleware, getUserTenants);

router.post("/:tenantId/select", authMiddleware, selectTenant);

router.get("/employees", authMiddleware, tenantMiddleware, getTenantEmployees);

router.get(
  "/:id/access",
  authMiddleware,
  tenantMiddleware,
  getDocumentAccessController,
);

export default router;
