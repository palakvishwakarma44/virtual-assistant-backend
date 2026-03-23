import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

async function testPdf() {
   try {
      const dataBuffer = fs.readFileSync("./dummy.pdf");
      const parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      console.log("PDF EXTRACTED TEXT:", data.text);
      await parser.destroy();
   } catch (e) {
      console.error("PDF PARSE FAILED:", e.message);
   }
}
testPdf();
