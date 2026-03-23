import mongoose from "mongoose";
import User from "./models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  const user = await User.findOne();
  console.log("Found user email:", user?.email);
  process.exit(0);
}
run();
