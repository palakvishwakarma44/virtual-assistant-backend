import dotenv from "dotenv"
dotenv.config()
import express from "express"

import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import cors from "cors"
import { askToAssistant } from "./controllers/user.controllers.js"
import isAuth from "./middlewares/isAuth.js"

const app = express()

// debug logger
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`!!!DEBUG!!! ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });
  next();
});

// ✅ SINGLE CLEAN CORS SETUP
app.use(cors({
  origin: "https://virtual-assistant-frontend-ten.vercel.app",
  credentials: true
}));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
 // preflight fix

const port = process.env.PORT || 5000

app.use(cookieParser())
app.use(express.json())

app.get("/api/ping", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
)

// routes
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)

// direct endpoint
app.post("/api/user/asktoassistant", isAuth, askToAssistant)

app.listen(port, () => {
  connectDb()
  console.log("server started")
})