import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Invitation = db.define(
  "Invitation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM("employee"),
      allowNull: false,
      defaultValue: "employee",
    },

    tokenHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("pending", "accepted", "expired", "revoked"),
      allowNull: false,
      defaultValue: "pending",
    },

    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "invitations",
    timestamps: true,
  },
);

export default Invitation;
