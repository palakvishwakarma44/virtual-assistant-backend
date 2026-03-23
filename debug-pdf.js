import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testPdfUpload() {
   const serverUrl = "http://localhost:8000";
   const filePath = path.resolve("./public/BuddyBytes_Report (1).pdf");
   
   if (!fs.existsSync(filePath)) {
      console.error("Test PDF not found at:", filePath);
      return;
   }

   console.log("Starting debug test with file:", filePath);
   
   const form = new FormData();
   form.append("command", "Summarize this PDF");
   form.append("image", fs.createReadStream(filePath)); // Field name is "image" in userRouter
   form.append("userLang", "en-US");

   try {
      console.log("Sending request to /api/user/asktoassistant...");
      const response = await fetch(`${serverUrl}/api/user/asktoassistant`, {
         method: "POST",
         headers: form.getHeaders(),
         // We need credentials but since we're running locally without a browser, 
         // we might need a dummy cookie or bypass auth if possible.
         // BUT wait, I can just use the isAuth middleware logic if I know the secret.
      });

      console.log("Response Status:", response.status);
      const text = await response.text();
      console.log("Response Body:", text);
   } catch (error) {
      console.error("Request failed:", error.message);
   }
}

testPdfUpload();
