import Tenant from "../models/tenantModel.js";
import TenantMember from "../models/tenantMemberModel.js";
import User from "../models/userModel.js";

export const getUserTenantsService = async (userId) => {
  const memberships = await TenantMember.findAll({
    where: {
      userId,
      status: "active",
    },
    attributes: ["tenantId", "role","status"],
    include: [
      {
        model: Tenant,
        attributes: ["id", "name"],
        required: true,
      },
    ],
  });

  return memberships.map((membership) => ({
    id: membership.Tenant.id,
    name: membership.Tenant.name,
    role: membership.role,
    status:membership.status
  }));
};

export const selectTenantService = async (userId, tenantId) => {
  const membership = await TenantMember.findOne({
    where: {
      userId,
      tenantId,
      status: "active",
    },
    include: [
      {
        model: Tenant,
        attributes: ["id", "name"],
        required: true,
      },
    ],
  });

  if (!membership) return null;

  return {
    id: membership.Tenant.id,
    name: membership.Tenant.name,
    role: membership.role,
  };
};

export const getTenantEmployeeService = async (tenantId, userId) => {
  const membership = await TenantMember.findOne({
    where: {
      tenantId,
      userId: userId,
      status: "active",
    },
  });

  if (!membership) {
    throw new Error("Only workspace members can view employees");
  }

  const employees = await TenantMember.findAll({
    where: {
      tenantId,
      role: "employee",
      status: "active",
    },
    attributes: ["userId", "role", "status"],
    include: [
      {
        model: User,
        attributes: ["id", "username", "email"],
        required: true,
      },
    ],
  });

  return employees.map((member) => ({
    id: member.User.id,
    username: member.User.username,
    email: member.User.email,
    role: member.role,
    status: member.status,
  }));
};
