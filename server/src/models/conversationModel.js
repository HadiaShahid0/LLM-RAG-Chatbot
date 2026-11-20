import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Conversation = db.define(
  "Conversation",
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

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    lastSummarizedMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "conversations",
    timestamps: true,
  },
);

export default Conversation;
