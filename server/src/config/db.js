// import { Sequelize } from "sequelize";
// import dotenv from "dotenv";
// dotenv.config();

// const db = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: "mysql",
//   },
// );

// export default db;

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || (isProduction ? 4000 : 3306),
    dialect: "mysql",

    dialectOptions: {
      ssl:
        process.env.DB_SSL === "true"
          ? {
              minVersion: "TLSv1.2",
              rejectUnauthorized: true,
            }
          : undefined,
    },

    logging: false,
  },
);

export default db;