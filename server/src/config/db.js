import { Sequelize } from "sequelize";
import mysql2 from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    dialect: "mysql",
    dialectModule: mysql2,
    dialectOptions: {
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    },
    logging: false,
  },
);

export default db;