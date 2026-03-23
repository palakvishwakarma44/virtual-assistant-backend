import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testGemini25() {
   const key = process.env.GEMINI_API_KEY;
   // Let's try the v1beta endpoint with the newly found model
   const modelName = "gemini-2.5-flash"; // or "models/gemini-2.5-flash"
   const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;

   const data = {
      contents: [{
         parts: [{ text: "Are you real? What is your model version?" }]
      }]
   };

   try {
      console.log(`Testing Gemini model: ${modelName}...`);
      const res = await axios.post(url, data);
      console.log("REST RESPONSE:", res.data.candidates[0].content.parts[0].text);
   } catch (error) {
      console.error("REST FAILED:", error.response?.data?.error?.message || error.message);
   }
}

testGemini25();
