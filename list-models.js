import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
   const key = process.env.GEMINI_API_KEY;
   const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

   try {
      console.log("Listing Gemini models for your key...");
      const res = await axios.get(url);
      console.log("AVAIABLE MODELS:", res.data.models.map(m => m.name));
   } catch (error) {
      console.error("LIST FAILED:", error.message);
   }
}

listModels();
