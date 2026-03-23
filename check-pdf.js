import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");
console.log("PDF MODULE EXPORT TYPE:", typeof pdfModule);
const pdf = pdfModule.default || pdfModule;
console.log("PDF FUNCTION TYPE:", typeof pdf);

async function testPdf() {
   try {
      const dataBuffer = fs.readFileSync("./dummy.pdf");
      const data = await pdf(dataBuffer);
      console.log("PDF EXTRACTED TEXT:", data.text);
      console.log("PDF METADATA:", data.info);
   } catch (e) {
      console.error("PDF PARSE FAILED:", e.message);
   }
}
testPdf();
