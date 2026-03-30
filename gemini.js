import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiResponse = async (command, assistantName, userName, userMemory, userLang = 'en-US', timezone = 'UTC') => {
    console.log("!!!DEBUG!!! AI Response process started. Command:", command, "Timezone:", timezone);

    // =========================
    // DUMMY MODE (TESTING)
    // =========================
    if (command && typeof command === "string" && command.trim().toLowerCase().startsWith("test:")) {
        return JSON.stringify({
            type: "general",
            userInput: command,
            response: "This is a dummy response for testing connectivity. Your backend and frontend are working!"
        });
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    const getSystemPrompt = () => `You are an ultra-advanced, highly intelligent, conversational AI assistant named ${assistantName}. Your master is ${userName}.
CRITICAL INSTRUCTION: You MUST reply in the EXACT SAME LANGUAGE as the user. If the user speaks English, reply in pure English. If Hindi, reply in Hindi. If Hinglish, reply in Hinglish. Never default to just Hindi.

USER MEMORY: "${userMemory}"
Use this memory heavily to provide deep personalization.

RESPONSE BEHAVIOR:
- Act like an AGI: Provide detailed, comprehensive, and smart answers.
- The user's language code: ${userLang}. You MUST ONLY reply in this language.
- Return ONLY valid JSON matching this structure:
{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show" | "open-website" | "play-song" | "save-memory" | "open-app" | "coding-helper" | "career-mentor" | "daily-briefing" | "automation-command" | "expense-tracker" | "set-reminder" | "generate-image" | "youtube-summary" | "summarize-pdf" | "analyze-image" | "todo-add" | "todo-show" | "todo-remove",
  "actionTarget": "<Extracted target for the action>",
  "userInput": "<the command minus assistant name>",
  "response": "<your highly detailed reply in ${userLang} language>"
}
Strictly raw JSON. No markdown blocks.`;

    let currentTime;
    try {
        currentTime = new Date().toLocaleString('en-US', { timeZone: timezone });
    } catch (e) {
        currentTime = new Date().toLocaleString();
    }
    const userPrompt = `Current Time (${timezone}): ${currentTime}\nUser Command: "${command}"`;

    // ==========================================
    // TRY GROQ (PRIMARY AI)
    // ==========================================
    if (groqKey) {
        try {
            console.log("🚀 Attempting Primary AI: Groq (LLaMA 3.3)");
            const groq = new Groq({ apiKey: groqKey });
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: getSystemPrompt() },
                    { role: "user", content: `${userPrompt}\n\nStrictly return valid JSON.` }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.6,
                max_tokens: 1512,
                response_format: { type: "json_object" }
            });

            let text = chatCompletion.choices[0]?.message?.content || "";
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();
            console.log("✅ Groq responded successfully.");
            return text;
        } catch (error) {
            console.warn("⚠️ Groq Error:", error.message, "- Falling back to Gemini...");
        }
    }

    // ==========================================
    // TRY GEMINI (FALLBACK AI)
    // ==========================================
    if (geminiKey) {
        try {
            console.log("🛰️ Attempting Fallback AI: Google Gemini 1.5");
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `${getSystemPrompt()}\n\n${userPrompt}`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            console.log("✅ Gemini Fallback responded successfully.");
            return text;
        } catch (error) {
            console.error("❌ Both Groq and Gemini failed:", error.message);
        }
    }

    // ==========================================
    // TOTAL FAIL-SAFE (NO AI WORKING)
    // ==========================================
    console.error("🌋 CRITICAL: All AI providers failed. Returning emergency fallback JSON.");
    return JSON.stringify({
        type: "general",
        userInput: command,
        response: "I'm currently having trouble reaching my brain (AI services). Master, please check if your Groq or Gemini API keys are correctly set in the backend environment."
    });
};

export default geminiResponse;