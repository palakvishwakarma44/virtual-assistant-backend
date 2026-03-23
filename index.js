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

/* ---------------- Request Logger ---------------- */

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `!!!DEBUG!!! ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`
    );
  });
  next();
});

/* ---------------- CORS ---------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://your-frontend-domain.com" // replace later
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS Not Allowed"));
    },
    credentials: true
  })
);

/* ---------------- ROOT ROUTE (FIX FOR RENDER 404) ---------------- */

app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "🚀 Virtual Assistant Backend is Live",
    time: new Date().toISOString()
  });
});

/* ---------------- Health Check ---------------- */

app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    message: "API is working",
    time: new Date().toISOString()
  });
});

/* ---------------- Routes ---------------- */

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.post("/api/assistant/ask", isAuth, askToAssistant);

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