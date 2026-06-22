import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { generate } from "./chatbot.js";

const app = express();
const port = 3001;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed."));
    }
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello Chatter! backend is running.");
});

app.post("/chat", upload.single("file"), async (req, res) => {
  const { message, threadId } = req.body;

  if (!threadId) {
    return res.status(400).json({ message: "threadId is required" });
  }

  let attachment = null;

  if (req.file) {
    const { mimetype, buffer, originalname } = req.file;

    if (mimetype.startsWith("image/")) {
      attachment = {
        type: "image",
        data: buffer.toString("base64"),
        mimeType: mimetype,
      };
    } else if (mimetype === "application/pdf") {
      try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        attachment = {
          type: "pdf",
          text: result.text,
          filename: originalname,
        };
      } catch (err) {
        console.error("PDF parse error:", err.message);
        return res.status(400).json({
          message: "Could not read the PDF. It may be password-protected or corrupted.",
        });
      }
    }
  }

  if (!message && !attachment) {
    return res.status(400).json({ message: "A message or file is required" });
  }

  console.log("Received message:", message || "(file only)");

  try {
    const result = await generate(message || "Analyze this file.", threadId, attachment);
    res.json({ message: result });
  } catch (err) {
    console.error("Generate error:", err.message);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
