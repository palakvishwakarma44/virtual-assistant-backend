import axios from "axios";

async function test() {
   try {
      // we don't have auth middleware here, wait /api/user/generate-image requires auth
      // So I'll just write the proxy logic to test it directly.
      const prompt = "cat";
      const encodedPrompt = encodeURIComponent(prompt);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=123`;
      console.log("Fetching from", pollinationsUrl);
      const response = await axios.get(pollinationsUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const imageUrl = `data:${response.headers['content-type']};base64,${base64}`;
      console.log(imageUrl.substring(0, 100));
   } catch(e) {
      console.log("Error:", e.message);
   }
}
test();
