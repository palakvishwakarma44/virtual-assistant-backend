import dotenv from "dotenv";
dotenv.config();

async function run() {
  const modelId = "black-forest-labs/FLUX.1-schnell";
  const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  
  try {
     const res = await fetch(url, {
        method: "POST",
        headers: {
           "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
           "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: "a red cat" })
     });
     
     console.log("Status:", res.status);
     console.log("Content-Type:", res.headers.get('content-type'));
     
     if (!res.ok) {
        const errText = await res.text();
        console.log("Error body:", errText);
     } else {
        const buffer = await res.arrayBuffer();
        console.log("Success! Bytes:", buffer.byteLength);
     }
  } catch (err) {
     console.error("Fetch Error:", err.message);
  }
}
run();
