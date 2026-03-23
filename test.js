import dotenv from 'dotenv';
import Groq from 'groq-sdk';
dotenv.config();

async function testGroq() {
    try {
        const key = process.env.GROQ_API_KEY?.trim();
        if (!key) throw new Error('No GROQ key');
        const groq = new Groq({ apiKey: key });
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Act as Friday. Respond ONLY with a JSON object: { "type": "general", "userInput": "hello", "response": "Hi" }' }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.5,
            max_tokens: 1024,
            response_format: { type: 'json_object' }
        });
        console.log('SUCCESS:', chatCompletion.choices[0]?.message?.content);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
testGroq();
