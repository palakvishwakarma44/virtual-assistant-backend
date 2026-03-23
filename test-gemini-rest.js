import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiRest() {
   const key = process.env.GEMINI_API_KEY;
   const model = "gemini-1.5-flash";
   const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

   const data = {
      contents: [{
         parts: [{ text: "hi" }]
      }]
   };

   try {
      console.log("Testing Gemini REST API...");
      const res = await axios.post(url, data);
      console.log("REST RESPONSE:", res.data.candidates[0].content.parts[0].text);
   } catch (error) {
      console.error("REST FAILED:", error.response?.data || error.message);
   }
}

testGeminiRest();
