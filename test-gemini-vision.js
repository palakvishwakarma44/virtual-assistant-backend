import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function run() {
  try {
     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
     const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="; // valid base64 image (1x1 red pixel)
     const mimeType = "image/png";

     const promptText = `CRITICAL: You must return a JSON object with this EXACT structure:
{
  "type": "analyze-image",
  "userInput": "analyze",
  "response": "<your detailed analysis>",
  "actionTarget": ""
}`;
     const resultGem = await model.generateContent([
       promptText,
       { inlineData: { data: base64Image, mimeType: mimeType } }
     ]);
     const text = resultGem.response.text();
     console.log("GEMINI VISION RESULT:");
     console.log(text);
  } catch (err) {
     console.error("GEMINI ERROR:", err.message);
  }
}
run();
