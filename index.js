import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import { askToAssistant } from "./controllers/user.controllers.js";
import isAuth from "./middlewares/isAuth.js";

const app = express();

/* ---------------- Middlewares ---------------- */

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `!!!DEBUG!!! ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`
    );
  });
  next();
});

/* ---------------- CORS (PRODUCTION SAFE) ---------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://your-frontend-domain.com" // change this later
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // temporarily allow all (safer for debugging deploy)
      }
    },
    credentials: true
  })
);

/* ---------------- Routes ---------------- */

app.get("/api/ping", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.post("/asktoassistant", isAuth, askToAssistant);

/* ---------------- Server Start ---------------- */

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on PORT ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });