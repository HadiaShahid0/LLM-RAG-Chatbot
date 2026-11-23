import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import Tenant from "../models/tenantModel.js";
import TenantMember from "../models/tenantMemberModel.js";
import Sequelize from "../config/db.js";

export const registerUserService = async (
  username,
  email,
  password,
  companyName,
) => {
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) throw new Error("User already exists");

  const transaction = await Sequelize.transaction();

  try {
    const bcryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create(
      {
        username,
        email,
        password: bcryptedPassword,
      },
      { transaction },
    );

    const newTenant = await Tenant.create(
      { 
        name: companyName,
        createdBy: newUser.id,
      },
      { transaction },
    );

    await TenantMember.create(
      {
        tenantId: newTenant.id,
        userId: newUser.id,
        role: "admin",
        status: "active",
        joinedAt: new Date(),
      },
      { transaction },
    );

    await transaction.commit();
    
    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
      tenant: newTenant,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const loginUserService = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }
  const token = generateToken(user.id);
  return { user, token };
};

export const logoutUserService = async (token) => {
  try {
    return { message: "User logged out successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

export const getUserProfileService = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const verifyUserService = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};
