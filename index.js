
import dotenv from "dotenv"
dotenv.config()
import express from "express"

import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
//import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"

const app = express()

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`!!!DEBUG!!! ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });
  next();
});

// app.use(cors({
//     origin:["http://localhost:5173","https://localhost:5174"],
//     credentials:true
// }))
// app.use(cors({
//     origin: 
//         "https://localhost:5173",

//     credentials: true
// }));

import cors from "cors"

app.use(cors({
  origin: "https://virtual-assistant-frontend-ten.vercel.app",
  credentials: true
}));//🔥 IMPORTANT

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
// });

const port = process.env.PORT || 5000

app.use(cookieParser())
app.use(express.json())
app.get("/api/ping", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
import { askToAssistant } from "./controllers/user.controllers.js"
import isAuth from "./middlewares/isAuth.js"

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.post("/api/user/asktoassistant", isAuth, askToAssistant) // Alias for old/direct calls

app.listen(port, () => {
  connectDb()
  console.log("server started")
})
