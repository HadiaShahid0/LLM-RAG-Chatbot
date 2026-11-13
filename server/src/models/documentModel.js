import { DataTypes } from "sequelize";
import Sequelize from "../config/db.js";

const Document = Sequelize.define(
  "Document",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("processing", "completed", "failed"),
      defaultValue: "processing",
      allowNull: false,
    },
  },
  {
    tableName: "documents",
    timestamps: true,
  },
);

export default Document;
