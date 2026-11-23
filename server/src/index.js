import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import routes from "./routes/index.js";
import "./models/index.js";

import sequelize from "./config/db.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

let dbConnection;

app.use("/api", async (req, res, next) => {
  try {
    if (!dbConnection) {
      dbConnection = sequelize.authenticate().catch((error) => {
        dbConnection = null;
        throw error;
      });
    }

    await dbConnection;
    next();
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(503).json({
      message: "Database connection failed",
    });
  }
});

app.use("/api", routes);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  try {
    await sequelize.authenticate();

    await sequelize.sync();

    console.log("MySQL connected successfully.");
    console.log("Database synchronized.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
  }
}

export default app;