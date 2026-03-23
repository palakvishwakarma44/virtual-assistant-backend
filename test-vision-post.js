import fetch from 'node-fetch'; // need node-fetch for form-data to work well
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function run() {
  const fileBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  fs.writeFileSync("test.png", fileBuffer);

  // 1. We mock the POST with a FormData exactly like frontend
  const form = new FormData();
  form.append("command", "Analyze this image");
  form.append("userLang", "en-US");
  form.append("image", fs.createReadStream("test.png"), { filename: "test.png", contentType: "image/png" });

  try {
     const loginRes = await fetch("http://localhost:8000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "palakvish78779@gmail.com", password: "12345" })
     });
     // I just need a cookie but actually the easiest test is creating a user or bypassing...
     // Wait, I can't authenticate easily without the real DB token... 
     // Oh, isAuth intercepts it!

  } catch(e) {
     console.error(e);
  }
}
run();
