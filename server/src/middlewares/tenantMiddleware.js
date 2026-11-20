import TenantMember from "../models/tenantMemberModel.js";
import Tenant  from "../models/tenantModel.js";

const tenantMiddleware = async (req, res, next) => {
  try {
    const tenantId = Number(req.headers["x-tenant-id"]);

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid tenant Id is required",
      });
    }

    const membership = await TenantMember.findOne({
      where: {
        userId: req.user.id,
        tenantId,
        status: "active",
      },
      attributes: ["id", "tenantId", "userId", "role"],
      include: [
        {
          model: Tenant,
          attributes: ["id", "name"],
          required: true,
        },
      ],
    });
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this workspace",
      });
    }

    req.tenant = {
      id: membership.Tenant.id,
      name: membership.Tenant.name,
      role: membership.role,
    };

    next();
  } catch (error) {
    console.error("Tenant middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify workspace access",
    });
  }
};

export default tenantMiddleware;
