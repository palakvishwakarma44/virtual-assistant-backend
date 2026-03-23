import { fileURLToPath } from 'url';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch'; // Requires node-fetch if not using native fetch correctly with FormData

async function run() {
  try {
     // 1. Create a dummy image
     fs.writeFileSync("dummy.png", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
     
     // 2. Login to get cookie
     const loginRes = await fetch("http://localhost:8000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "palakvish78779@gmail.com", password: "12345" }) // Assuming wrong pwd, wait I need valid pwd. 
     });
     
     // Wait, I can test it directly on backend without auth by creating a direct DB test script instead of HTTP!
  } catch (err) {
     console.error(err);
  }
}
run();
