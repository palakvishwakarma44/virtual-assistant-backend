import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const modelId = "black-forest-labs/FLUX.1-schnell";
  const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  
  console.log("Fetching from HF:", url);
  try {
     const res = await axios.post(url, { inputs: "a red cat" }, {
        headers: {
           Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
           "Content-Type": "application/json"
        },
        responseType: "arraybuffer",
        timeout: 60000
     });
     
     console.log("Auth length:", process.env.HUGGINGFACE_API_KEY?.length);
     console.log("Status:", res.status);
     console.log("Content-Type:", res.headers['content-type']);
     console.log("Length:", res.data.length);
  } catch (err) {
     console.error("HF ERROR:", err.response?.status, err.message);
     if (err.response?.data) {
        console.error("Details:", Buffer.from(err.response.data).toString());
     }
  }
}
run();
