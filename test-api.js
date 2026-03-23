import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import fs from 'fs';

dotenv.config();

async function testGroqVision() {
    try {
        const key = process.env.GROQ_API_KEY?.trim();
        if (!key) throw new Error("No key");
        
        const groq = new Groq({ apiKey: key });

        // Let's create a tiny 100x100 white pixel PNG base64 to test
        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const dataUri = `data:image/png;base64,${base64Image}`;

        console.log("Sending to Groq Vision...");
        const chatCompletion = await groq.chat.completions.create({
           messages: [
              {
                 role: "user",
                 content: [
                    { type: "text", text: `What is in this image? Return a JSON object with "type": "analyze-image" or "general", "userInput": "test", "response": "<your detailed answer>" and "actionTarget": "".` },
                    { type: "image_url", image_url: { url: dataUri } }
                 ]
              }
           ],
           model: "llama-3.2-11b-vision-preview",
           temperature: 0.5,
           response_format: { type: "json_object" }
        });

        console.log("SUCCESS:", chatCompletion.choices[0]?.message?.content);
    } catch (e) {
        console.error("GROQ ERROR:", e.message);
        if (e.error) console.error(e.error);
    }
}
testGroqVision();
