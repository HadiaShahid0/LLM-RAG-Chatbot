import crypto from "crypto";
import Invitation from "../models/invitationModel.js";
import Tenant from "../models/tenantModel.js";
import TenantMember from "../models/tenantMemberModel.js";
import User from "../models/userModel.js";
import { sendEmailService } from "./emailService.js";
import { invitationEmailTemplate } from "../templates/invitationEmailTemplate.js";
import db from "../config/db.js";
import { Op } from "sequelize";

import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

export const createInvitationService = async (
  tenantId,
  adminId,
  email,
  message = "",
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const admin = await TenantMember.findOne({
    where: {
      tenantId,
      userId: adminId,
      role: "admin",
      status: "active",
    },
  });

  if (!admin) {
    throw new Error("Only workspace admins can invite employees");
  }

  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (user) {
    const existingMember = await TenantMember.findOne({
      where: {
        tenantId,
        userId: user.id,
      },
    });

    if (existingMember) {
      throw new Error("This user already belongs to this workspace");
    }
  }

  const existingInvitation = await Invitation.findOne({
    where: {
      tenantId,
      email: normalizedEmail,
      status: "pending",
    },
  });

  if (existingInvitation) {
    throw new Error("An invitation is already pending for this email");
  }

  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    tenantId,
    email: normalizedEmail,
    role: "employee",
    tokenHash,
    message,
    invitedBy: adminId,
    expiresAt,
    status: "pending",
  });

  const tenant = await Tenant.findByPk(tenantId);

  const inviter = await User.findByPk(adminId);

  const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${token}`;

  const html = invitationEmailTemplate({
    companyName: tenant.name,
    inviterName: inviter.username,
    invitationLink,
    message,
  });

  try {
    await sendEmailService({
      to: normalizedEmail,
      subject: `Invitation to join ${tenant.name}`,
      html,
    });
  } catch (error) {
    await invitation.destroy();
    throw error;
  }

  return {
    message: "Invitation sent successfully",
    invitation: {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    },
  };
};

export const getInvitationsService = async (tenantId, adminId) => {
  // Verify admin
  const admin = await TenantMember.findOne({
    where: {
      tenantId,
      userId: adminId,
      role: "admin",
      status: "active",
    },
  });

  if (!admin) {
    throw new Error("Only workspace admins can view invitations");
  }

  // Update expired invitations
  await Invitation.update(
    { status: "expired" },
    {
      where: {
        tenantId,
        status: "pending",
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    },
  );

  // Fetch invitations
  return await Invitation.findAll({
    where: { tenantId },
    attributes: [
      "id",
      "email",
      "role",
      "message",
      "status",
      "expiresAt",
      "acceptedAt",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });
};

export const resendInvitationService = async (
  invitationId,
  tenantId,
  adminId,
) => {
  const admin = await TenantMember.findOne({
    where: {
      tenantId,
      userId: adminId,
      role: "admin",
      status: "active",
    },
  });

  if (!admin) {
    throw new Error("Only workspace admins can resend invitations");
  }

  const invitation = await Invitation.findOne({
    where: {
      id: invitationId,
      tenantId,
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (!["pending", "expired"].includes(invitation.status)) {
    throw new Error("This invitation cannot be resent");
  }

  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const tenant = await Tenant.findByPk(tenantId);
  const inviter = await User.findByPk(adminId);

  const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${token}`;

  const html = invitationEmailTemplate({
    companyName: tenant.name,
    inviterName: inviter.username,
    invitationLink,
    message: invitation.message,
  });

  // Send email before replacing the existing token
  await sendEmailService({
    to: invitation.email,
    subject: `Invitation to join ${tenant.name}`,
    html,
  });

  await invitation.update({
    tokenHash,
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: null,
  });

  return {
    message: "Invitation resent successfully",
  };
};

export const revokeInvitationService = async (
  invitationId,
  tenantId,
  adminId,
) => {
  const admin = await TenantMember.findOne({
    where: {
      tenantId,
      userId: adminId,
      role: "admin",
      status: "active",
    },
  });

  if (!admin) {
    throw new Error("Only workspace admins can revoke invitations");
  }

  const invitation = await Invitation.findOne({
    where: {
      id: invitationId,
      tenantId,
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new Error("Only pending invitations can be revoked");
  }

  await invitation.update({
    status: "revoked",
  });

  return {
    message: "Invitation revoked successfully",
  };
};

export const validateInvitationService = async (token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await Invitation.findOne({
    where: { tokenHash },
  });

  if (!invitation) {
    throw new Error("Invalid invitation link");
  }

  if (invitation.status !== "pending") {
    throw new Error("This invitation is no longer active");
  }

  if (new Date(invitation.expiresAt) <= new Date()) {
    await invitation.update({ status: "expired" });
    throw new Error("This invitation has expired");
  }

  const tenant = await Tenant.findByPk(invitation.tenantId);

  if (!tenant) {
    throw new Error("Company not found");
  }

  const existingUser = await User.findOne({
    where: { email: invitation.email },
    attributes: ["id"],
  });

  return {
    email: invitation.email,
    companyName: tenant.name,
    hasAccount: Boolean(existingUser),
    expiresAt: invitation.expiresAt,
  };
};
export const acceptInvitationService = async (token, username, password) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const transaction = await db.transaction();

  try {
    const invitation = await Invitation.findOne({
      where: {
        tokenHash,
        status: "pending",
        expiresAt: { [Op.gt]: new Date() },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    const existingUser = await User.findOne({
      where: { email: invitation.email },
      transaction,
    });

    if (existingUser) {
      throw new Error("An account already exists. Please log in.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        username: username.trim(),
        email: invitation.email,
        password: hashedPassword,
      },
      { transaction },
    );

    await TenantMember.create(
      {
        tenantId: invitation.tenantId,
        userId: user.id,
        role: "employee",
        status: "active",
        joinedAt: new Date(),
      },
      { transaction },
    );

    await invitation.update(
      {
        status: "accepted",
        acceptedAt: new Date(),
      },
      { transaction },
    );

    await transaction.commit();

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      tenantId: invitation.tenantId,
      token: generateToken(user.id),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const acceptExistingInvitationService = async (token, userId) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const transaction = await db.transaction();

  try {
    const invitation = await Invitation.findOne({
      where: {
        tokenHash,
        status: "pending",
        expiresAt: { [Op.gt]: new Date() },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    const user = await User.findByPk(userId, { transaction });

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error("Your account email does not match the invitation");
    }

    const existingMembership = await TenantMember.findOne({
      where: {
        tenantId: invitation.tenantId,
        userId,
      },
      transaction,
    });

    if (existingMembership) {
      throw new Error("You already belong to this company");
    }

    await TenantMember.create(
      {
        tenantId: invitation.tenantId,
        userId,
        role: "employee",
        status: "active",
        joinedAt: new Date(),
      },
      { transaction },
    );

    await invitation.update(
      {
        status: "accepted",
        acceptedAt: new Date(),
      },
      { transaction },
    );

    await transaction.commit();

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      tenantId: invitation.tenantId,
      token: generateToken(user.id),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
