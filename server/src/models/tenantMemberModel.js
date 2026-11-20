import { DataTypes } from "sequelize";
import db from "../config/db.js";

const TenantMember = db.define(
  "TenantMember",
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "employee"),
      allowNull: false,
      defaultValue: "employee",
    },
    status: {
      type: DataTypes.ENUM("active", "suspended"),
      allowNull: false,
      defaultValue: "active",
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tenant_members",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tenantId", "userId"],
      },
    ],
  },
);

export default TenantMember;
