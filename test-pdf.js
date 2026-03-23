import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  const systemPrompt = `CRITICAL: You must return a JSON object with this EXACT structure:
{
  "type": "summarize-pdf",
  "actionTarget": "",
  "userInput": "Summarize this document",
  "response": "<summary>"
}`;
  const pdfText = "This is a dummy PDF file content covering physics and mathematics.";
  const userPrompt = `User uploaded a PDF with following content: \n\n${pdfText}\n\nUser Question/Request: Summarize this document`;

  try {
     const chatCompletion = await groq.chat.completions.create({
         messages: [
             { role: "system", content: systemPrompt },
             { role: "user", content: userPrompt }
         ],
         model: "llama-3.1-8b-instant",
         response_format: { type: "json_object" }
     });
     console.log("PDF Result:");
     console.log(chatCompletion.choices[0]?.message?.content);
  } catch (err) {
     console.error("GROQ PDF Error:", err.message);
  }
}
run();
