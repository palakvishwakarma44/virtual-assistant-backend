import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js";
import axios from "axios";
import User from "../models/user.model.js"
import moment from "moment"
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { YoutubeTranscript } from 'youtube-transcript';
import { createRequire } from "module";
import { GoogleGenerativeAI } from "@google/generative-ai";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

// Helper to sanitize LLM JSON output (removes markdown code blocks if present)
const extractJSON = (rawStr) => {
   if (!rawStr) return null;
   try {
      // Find the first { and last } to strip any prefix/suffix text or markdown backticks
      const start = rawStr.indexOf('{');
      const end = rawStr.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      const cleanStr = rawStr.substring(start, end + 1);
      return JSON.parse(cleanStr);
   } catch (e) {
      console.error("JSON extraction error:", e.message, "Raw response was:", rawStr);
      return null;
   }
}

export const getCurrentUser = async (req, res) => {
   try {
      const userId = req.userId
      const user = await User.findById(userId).select("-password")
      if (!user) {
         return res.status(400).json({ message: "user not found" })
      }

      return res.status(200).json(user)
   } catch (error) {
      return res.status(400).json({ message: "get current user error" })
   }
}

export const updateAssistant = async (req, res) => {
   try {
      const { assistantName, imageUrl } = req.body
      let assistantImage;
      if (req.file) {
         assistantImage = await uploadOnCloudinary(req.file.path)
      } else {
         assistantImage = imageUrl
      }

      const user = await User.findByIdAndUpdate(req.userId, {
         assistantName, assistantImage
      }, { new: true }).select("-password")
      return res.status(200).json(user)


   } catch (error) {
      return res.status(400).json({ message: "updateAssistantError user error" })
   }
}


export const askToAssistant = async (req, res) => {
   try {
      console.log("Full Request Body:", req.body);
      const { command, userLang } = req.body
      console.log("Extracted Command:", command, "User Lang:", userLang);
      const user = await User.findById(req.userId);
      if (command) {
         user?.history?.push(command);
         user?.save()?.catch(err => console.error("History save error:", err));
      }

      if (!user) {
         console.warn("!!!DEBUG!!! User not found for ID:", req.userId);
         // Don't crash—use generic names
      }
      const userName = user?.name || "User";
      const assistantName = user?.assistantName || "Assistant";
      const userMemory = user?.memory || "";

      let result = null;
      if (req.file) {
         console.log("!!!DEBUG!!! Processing file:", req.file.path, "MIME:", req.file.mimetype);
         
         if (req.file.mimetype.startsWith("image/")) {
            console.log("!!!DEBUG!!! Analyzing image with Gemini 2.5 Flash...");
            try {
               const imageBuffer = fs.readFileSync(req.file.path);
               const base64Image = imageBuffer.toString('base64');
               
               const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
               const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Verified model for this key
               
               const promptText = `You are ${assistantName}, a highly intelligent AI. Your owner is ${userName}.
The user uploaded an image. Command: "${command || 'Analyze this image'}".
Analyze it in depth. Reply strictly in ${userLang}.

EXPECTED JSON STRUCTURE:
{
  "type": "analyze-image",
  "userInput": "${command || 'Analyze image'}",
  "response": "<detailed analysis>",
  "actionTarget": ""
}`;
               const resultGem = await model.generateContent([
                  { text: promptText },
                  { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
               ]);
               result = resultGem.response.text();
               console.log("!!!DEBUG!!! Gemini 2.5 Vision raw response:", result);
            } catch (error) {
               console.error("!!!DEBUG!!! Gemini 2.5 Vision Error:", error.message);
               // Simple fallback if gemini fails
               result = JSON.stringify({
                  type: "general",
                  userInput: command,
                  response: "I'm having a lot of trouble seeing images right now. Please try again later or type your question."
               });
            }
         } else if (req.file.mimetype.includes("pdf")) {
            console.log("!!!DEBUG!!! Parsing PDF with Gemini 2.5 Flash...");
            let parser = null;
            try {
               const dataBuffer = fs.readFileSync(req.file.path);
               parser = new PDFParse({ data: dataBuffer });
               const pdfData = await parser.getText();
               const pdfText = (pdfData.text || "This PDF seems to be a scanned image only.").substring(0, 30000);
               
               const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
               const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
               
               const promptText = `User: ${userName}. PDF content: "${pdfText}". Request: "${command || 'Summarize'}". Language: ${userLang}.
Return ONLY this JSON format:
{
  "type": "summarize-pdf",
  "userInput": "PDF Document",
  "response": "<your smart reply>",
  "actionTarget": ""
}`;
               const resultGem = await model.generateContent(promptText);
               result = resultGem.response.text();
            } catch (err) {
               console.error("!!!DEBUG!!! Gemini 2.5 PDF Error:", err.message);
               result = JSON.stringify({ type: "general", response: "I encountered an error reading your PDF with Gemini 2.5." });
            } finally {
               if (parser) try { await parser.destroy(); } catch(e) {}
            }
         } else {
            console.warn("!!!DEBUG!!! Unsupported MIME:", req.file.mimetype);
            result = await geminiResponse(command, assistantName, userName, userMemory, userLang);
         }
      } else {
         result = await geminiResponse(command, assistantName, userName, userMemory, userLang);
      }

      if (!result) {
         return res.status(500).json({ response: "AI failed to respond. Please check your API keys and internet connection." });
      }

      console.log("!!!DEBUG!!! Parsing AI output:", result);
      const gemResult = extractJSON(result);

      if (!gemResult) {
         console.error("!!!DEBUG!!! Result was not valid JSON. RAW:", result);
         // Fallback: If it's just plain text, wrap it as a general response
         return res.json({
            type: "general",
            userInput: command,
            response: result.length > 500 ? "I had trouble formatting my response. Please try a simpler question." : result
         });
      }

      console.log("Processed Gemini Result:", gemResult);
      const type = gemResult.type

      // 🔥 Handle image generation directly here
      if (type === "generate-image") {
         const prompt = gemResult.actionTarget || command;
         const modelId = "black-forest-labs/FLUX.1-schnell";
         const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
         
         try {
            const hfRes = await fetch(url, {
               method: "POST",
               headers: {
                  "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                  "Content-Type": "application/json"
               },
               body: JSON.stringify({ inputs: prompt })
            });

            if (!hfRes.ok) throw new Error("HuggingFace API failed");
            
            const buffer = await hfRes.arrayBuffer();
            const pContentType = hfRes.headers.get('content-type') || 'image/jpeg';
            const pBase64 = Buffer.from(buffer).toString('base64');
            
            return res.json({
               type: "generate-image",
               image: `data:${pContentType};base64,${pBase64}`,
               response: gemResult.response
            });
         } catch (err) {
            console.error("Generate image direct failed:", err.message);
            return res.json({
               type: "general",
               userInput: command,
               response: "Sorry, I couldn't generate the image right now."
            });
         }
      }

      // Handle save-memory (Productivity & Personalization updates)
      if (type === "save-memory") {
         const newFact = gemResult.actionTarget;
         if (newFact && !user.memory.includes(newFact)) {
            user.memory = user.memory ? user.memory + " | " + newFact : newFact;
            await user.save().catch(e => console.error("Memory saving error:", e));
         }
         return res.json({
            type,
            userInput: gemResult.userInput,
            response: gemResult.response
         });
      }

      switch (type) {
         case 'get-date':
            return res.json({
               type,
               userInput: gemResult.userInput,
               response: `current date is ${moment().format("YYYY-MM-DD")}`
            });
         case 'get-time':
            return res.json({
               type,
               userInput: gemResult.userInput,
               response: `current time is ${moment().format("hh:mm A")}`
            });
         case 'get-day':
            return res.json({
               type,
               userInput: gemResult.userInput,
               response: `today is ${moment().format("dddd")}`
            });
         case 'get-month':
            return res.json({
               type,
               userInput: gemResult.userInput,
               response: `today is ${moment().format("MMMM")}`
            });
         case 'google-search':
         case 'youtube-search':
         case 'youtube-play':
         case 'general':
         case "calculator-open":
         case "instagram-open":
         case "facebook-open":
         case "weather-show":
         case "open-website":
         case "play-song":
         case "open-app":
         case "coding-helper":
         case "career-mentor":
         case "daily-briefing":
         case "automation-command":
         case "expense-tracker":
         case "set-reminder":
         case "generate-image":
         case "youtube-summary":
         case "summarize-pdf":
         case "analyze-image":
         case "todo-add":
         case "todo-show":
         case "todo-remove":
            return res.json({
               type,
               actionTarget: gemResult.actionTarget || "",
               userInput: gemResult.userInput || command,
               response: gemResult.response,
            });

         default:
            return res.status(400).json({ response: "I didn't understand that command." })
      }


   } catch (error) {
      console.error("askToAssistant main catch error:", error.message);
      if (error.response) {
          console.error("Error response data:", error.response.data);
      }
      return res.status(500).json({ response: "I encountered an error processing your request. Please check your API keys." });
   }
}

import { exec } from "child_process"
export const openApp = async (req, res) => {
   try {
      const { appName } = req.body;
      if (!appName) {
         return res.status(400).json({ success: false, message: "App name is required" });
      }
      console.log("Attempting to open PC application:", appName);

      let command = `start ${appName}`;

      // Map common spoken names to actual Windows executables
      const appMap = {
         "notepad": "notepad",
         "calculator": "calc",
         "chrome": "chrome",
         "vs code": "code",
         "vscode": "code",
         "edge": "msedge",
         "file explorer": "explorer",
         "word": "winword",
         "excel": "excel",
         "powerpoint": "powerpnt",
         "spotify": "spotify",
         "whatsapp": "whatsapp"
      };

      const targetExe = appMap[appName.toLowerCase()] || appName;
      command = `start ${targetExe}`;

      exec(command, (error, stdout, stderr) => {
         if (error) {
            console.error(`Exec error opening ${targetExe}:`, error);
            return res.status(500).json({ success: false, message: `Failed to open ${appName}` });
         }
         return res.json({ success: true, message: `Opened ${appName}` });
      });

   } catch (error) {
      console.error("Open app error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
   }
}

export const summarizeYoutube = async (req, res) => {
   try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ response: "Please provide a YouTube URL." });

      const transcript = await YoutubeTranscript.fetchTranscript(url);
      if (!transcript || transcript.length === 0) {
         return res.json({ response: "Could not fetch transcript for this video." });
      }

      const fullText = transcript.map(t => t.text).join(' ').substring(0, 15000); // truncate for limits

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const chatCompletion = await groq.chat.completions.create({
         messages: [
            { role: "system", content: "You are an AI assistant. Summarize the following YouTube transcript into key bullet points clearly and concisely." },
            { role: "user", content: fullText }
         ],
         model: "llama-3.1-8b-instant",
         temperature: 0.5,
      });

      return res.json({ response: chatCompletion.choices[0]?.message?.content || "Could not generate summary." });
   } catch (error) {
      console.error("YouTube summary error:", error);
      return res.status(500).json({ response: "Error summarizing YouTube video." });
   }
}
export const summarizePdf = async (req, res) => {
   try {
      if (!req.file) return res.status(400).json({ response: "No PDF uploaded." });

      console.log("!!!DEBUG!!! Directly Summarizing PDF with PDFParse class:", req.file.path);
      const dataBuffer = fs.readFileSync(req.file.path);
      const parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      const text = (data.text || "This PDF seems to be empty.").substring(0, 30000); 
      await parser.destroy();

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const chatCompletion = await groq.chat.completions.create({
         messages: [
            { role: "system", content: "You are an AI assistant. Summarize the following document content clearly." },
            { role: "user", content: text }
         ],
         model: "llama-3.3-70b-versatile",
         temperature: 0.5,
      });
      
      console.log("PDF summary generated via Groq 70B");
      return res.json({ response: chatCompletion.choices[0]?.message?.content || "Could not summarize PDF." });
   } catch (error) {
      console.error("PDF summary error:", error.message);
      return res.status(500).json({ response: "Error summarizing PDF: " + error.message });
   }
};

export const analyzeImage = async (req, res) => {
   try {
      if (!req.file) {
         console.warn("!!!DEBUG!!! No image file found in analyzeImage request");
         return res.status(400).json({ response: "No image uploaded." });
      }

      console.log("Analyzing Image:", req.file.path);
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const userPrompt = req.body.prompt || "Describe what's in this image and detect objects.";

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const chatCompletion = await groq.chat.completions.create({
         messages: [
            {
               role: "user",
               content: [
                  { type: "text", text: userPrompt },
                  { type: "image_url", image_url: { url: dataUri } }
               ]
            }
         ],
         model: "llama-3.2-11b-vision-preview",
         temperature: 0.5,
      });

      console.log("Image analysis generated via Groq Vision");
      return res.json({ response: chatCompletion.choices[0]?.message?.content || "Could not analyze image." });
   } catch (error) {
      console.error("Image analysis error:", error.message);
      return res.status(500).json({ response: "Error analyzing image: " + error.message });
   }
};

export const deleteHistory = async (req, res) => {
   try {
      const user = await User.findById(req.userId);
      if (!user) {
         return res.status(404).json({ success: false, message: "User not found." });
      }
      user.history = [];
      await user.save();
      return res.status(200).json({ success: true, message: "History cleared successfully." });
   } catch (error) {
      console.error("Delete history error:", error);
      return res.status(500).json({ success: false, message: "Server error clearing history." });
   }
};

export const generateImage = async (req, res) => {
   try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ response: "Prompt is required." });

      const hfKey = process.env.HUGGINGFACE_API_KEY;

      // ─── Try HuggingFace Router with multiple models ───
      if (hfKey) {
         const hfModels = [
            "black-forest-labs/FLUX.1-schnell",   // fastest, free tier
            "stabilityai/stable-diffusion-xl-base-1.0",
            "runwayml/stable-diffusion-v1-5",
         ];

         for (const modelId of hfModels) {
            try {
               console.log(`[generateImage] Trying HF Router model: ${modelId}`);
               const hfResponse = await axios.post(
                  `https://router.huggingface.co/hf-inference/models/${modelId}`,
                  { inputs: prompt },
                  {
                     headers: {
                        Authorization: `Bearer ${hfKey}`,
                        "Content-Type": "application/json"
                     },
                     responseType: "arraybuffer",
                     timeout: 60000
                  }
               );
               const contentType = hfResponse.headers['content-type'] || 'image/jpeg';
               if (contentType.startsWith('image/')) {
                  const base64 = Buffer.from(hfResponse.data, 'binary').toString('base64');
                  const imageUrl = `data:${contentType};base64,${base64}`;
                  console.log(`[generateImage] ✅ Success via HF model: ${modelId}`);
                  return res.json({ imageUrl });
               } else {
                  console.warn(`[generateImage] Model ${modelId} returned non-image content:`, contentType);
               }
            } catch (hfErr) {
               const status = hfErr.response?.status;
               console.error(`[generateImage] HF model ${modelId} failed (${status}):`, hfErr.message);
               if (hfErr.response?.data) {
                  try {
                     const errJson = JSON.parse(Buffer.from(hfErr.response.data).toString());
                     console.error("[generateImage] HF Error Details:", errJson);
                  } catch (e) {}
               }
               // Continue to next model
            }
         }
      }

      // ─── Pollinations AI fallback ───
      const seed = Math.floor(Math.random() * 9999999);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&seed=${seed}&model=flux`;
      console.log(`[generateImage] Falling back to Pollinations AI with seed=${seed}`);

      try {
         const pResponse = await axios.get(pollinationsUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
         });

         const pContentType = pResponse.headers['content-type'] || 'image/jpeg';
         if (!pContentType.includes('text/html')) {
            const pBase64 = Buffer.from(pResponse.data, 'binary').toString('base64');
            const pImageUrl = `data:${pContentType};base64,${pBase64}`;
            console.log("[generateImage] ✅ Success via Pollinations.");
            return res.json({ imageUrl: pImageUrl });
         } else {
            console.warn("[generateImage] Pollinations returned HTML page.");
         }
      } catch (pollErr) {
         console.error("[generateImage] Pollinations Error:", pollErr.message);
      }

      // ─── All services failed ───
      return res.status(500).json({ response: "Could not generate image. All services are currently busy, please try again in a moment." });

   } catch (error) {
      console.error("[generateImage] Unexpected Error:", error.message);
      return res.status(500).json({ response: "Unexpected error during image generation." });
   }
};


