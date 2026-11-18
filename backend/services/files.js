import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { Document, Packer, Paragraph } from "docx";
import { env } from "../config/env.js";
import { fail } from "../utils/http.js";
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    cb(
      null,
      [".pdf", ".docx", ".txt"].includes(
        path.extname(file.originalname).toLowerCase(),
      ),
    );
  },
});
export async function extract(file) {
  if (!file)
    fail(400, "Upload a PDF, DOCX, or TXT manuscript (maximum 10 MB).");
  const ext = path.extname(file.originalname).toLowerCase();
  let text;
  try {
    if (ext === ".pdf") {
      if (file.buffer.subarray(0, 5).toString() !== "%PDF-")
        fail(400, "Invalid PDF file.");
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else if (ext === ".docx") {
      if (file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b)
        fail(400, "Invalid DOCX file.");
      // Bound advertised ZIP expansion before letting the XML parser read a document.
      let expanded = 0;
      for (let i = 0; i < file.buffer.length - 46; i++)
        if (file.buffer.readUInt32LE(i) === 0x02014b50) {
          expanded += file.buffer.readUInt32LE(i + 24);
          if (expanded > 30 * 1024 * 1024)
            fail(400, "Document expands beyond the 30 MB limit.");
        }
      text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
    } else {
      text = file.buffer.toString("utf8");
      if (text.includes("\u0000")) fail(400, "Invalid text file.");
    }
  } catch (e) {
    if (e.status) throw e;
    fail(
      400,
      "Unable to read this document. Use a text PDF, DOCX, or UTF-8 TXT file.",
    );
  }
  if (!text.trim() || text.length > 300000)
    fail(
      400,
      "Document must contain readable text and be under 300,000 characters. Scanned PDFs need OCR first.",
    );
  return { text, ext };
}
export async function storeFile(file, ext) {
  await fs.mkdir(env.uploads, { recursive: true });
  const filename = randomUUID() + ext;
  await fs.writeFile(path.join(env.uploads, filename), file.buffer, {
    flag: "wx",
  });
  return filename;
}
export async function docxBuffer(title, text) {
  return Packer.toBuffer(
    new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: "Heading1" }),
            ...text.split("\n").map((t) => new Paragraph(t)),
          ],
        },
      ],
    }),
  );
}
