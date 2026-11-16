import { Sequelize } from "sequelize";
import mysql2 from "mysql2";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const sslOptions =
  process.env.DB_SSL === "true"
    ? {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
        ca: process.env.DB_CA_PATH
          ? fs.readFileSync(process.env.DB_CA_PATH)
          : undefined,
      }
    : undefined;

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
      ssl: sslOptions,
    },
    logging: false,
  },
);

export default db;