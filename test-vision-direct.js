import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { askToAssistant } from "./controllers/user.controllers.js";
import User from "./models/user.model.js";
import fs from "fs";

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  
  const user = await User.findOne();
  if (!user) throw new Error("No user");

  // Create fake image
  fs.writeFileSync("test.jpeg", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
  
  const req = {
     userId: user._id.toString(),
     body: { command: "what is this?", userLang: "en-US" },
     file: {
        path: "test.jpeg",
        mimetype: "image/jpeg"
     }
  };

  const res = {
     json: (data) => console.log("RES.JSON:", JSON.stringify(data, null, 2)),
     status: (code) => { console.log("STATUS:", code); return res; }
  };

  console.log("Calling askToAssistant directly...");
  await askToAssistant(req, res);
  console.log("Done");
  process.exit(0);
}
run();
