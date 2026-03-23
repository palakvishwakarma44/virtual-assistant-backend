import dotenv from 'dotenv';
import Groq from 'groq-sdk';
dotenv.config();

async function testIntent() {
   const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
   const command = "I spent 100 rupees on a pen";
   const userName = "TestUser";
   const assistantName = "Maya";
   const userLang = "en-US";

   const systemPrompt = `You are ${assistantName}. Master is ${userName}. 
Respond in JSON only.
{
  "type": "expense-tracker" | "expense-show" | "expense-clear" | "general",
  "actionTarget": "<item>",
  "userInput": "<cmd>",
  "response": "<msg>"
}`;

   try {
      const chatCompletion = await groq.chat.completions.create({
         messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: command }
         ],
         model: "llama-3.3-70b-versatile",
         response_format: { type: "json_object" }
      });
      console.log("AI RESPONSE:", chatCompletion.choices[0].message.content);
   } catch (e) {
      console.error("FAIL:", e.message);
   }
}

testIntent();
