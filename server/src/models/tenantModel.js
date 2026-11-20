import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Tenant = db.define(
  "Tenant",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "tenants",
    timestamps: true,
  },
);

export default Tenant;
