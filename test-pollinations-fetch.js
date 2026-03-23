import axios from "axios";

async function run() {
  try {
     const prompt = "a red cat";
     const seed = Math.floor(Math.random() * 9999999);
     const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&seed=${seed}`;
     
     console.log("Fetching:", pollinationsUrl);
     console.time("fetchImage");
     const pResponse = await axios.get(pollinationsUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
     });
     console.timeEnd("fetchImage");
     
     const pContentType = pResponse.headers['content-type'] || 'image/jpeg';
     console.log("ContentType:", pContentType);
     console.log("Bytes:", pResponse.data.length);
     
  } catch (err) {
    console.error("ERROR:");
    console.error(err.response?.status, err.message);
  }
}

run();
