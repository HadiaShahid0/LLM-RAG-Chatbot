import { DataTypes } from "sequelize";
import db from "../config/db.js";

const DocumentPermission = db.define(
  "DocumentPermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    grantedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "document_permissions",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["documentId", "userId"],
      },
    ],
  },
);

export default DocumentPermission;