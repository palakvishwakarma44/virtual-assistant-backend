import dotenv from 'dotenv';
import fs from 'fs';
import geminiResponse from './gemini.js';

dotenv.config();

async function test() {
    let output = "Testing generate image...\n";
    const res1 = await geminiResponse("generate image of iron man", "Assistant", "User", "");
    output += "generate image response: " + res1 + "\n\n";

    output += "Testing pdf summary...\n";
    const res2 = await geminiResponse("summarize the uploaded pdf", "Assistant", "User", "");
    output += "pdf summary response: " + res2 + "\n\n";

    fs.writeFileSync('test-output2.txt', output, 'utf8');
}

test();
