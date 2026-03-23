import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function testGemini25Vision() {
   const key = process.env.GEMINI_API_KEY;
   const modelName = "gemini-2.5-flash"; 
   const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;

   // Use a small local image
   const imagePath = "./public/red_square.png";
   if (!fs.existsSync(imagePath)) { console.error("image missing"); return; }
   const base64 = fs.readFileSync(imagePath).toString("base64");

   const data = {
      contents: [{
         parts: [
            { text: "What is this image?" },
            { inlineData: { mimeType: "image/png", data: base64 } }
         ]
      }]
   };

   try {
      console.log(`Testing Vision with ${modelName}...`);
      const res = await axios.post(url, data);
      console.log("VISION RESPONSE:", res.data.candidates[0].content.parts[0].text);
   } catch (error) {
      console.error("VISION FAILED:", error.response?.data?.error?.message || error.message);
   }
}

testGemini25Vision();
