import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { detectSlabOutline } from "./src/server/geminiHandler.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side Gemini API endpoint
app.post("/api/outline", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }
    const result = await detectSlabOutline(image, mimeType || "image/jpeg");
    return res.json(result);
  } catch (error) {
    console.error("API error in /api/outline:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to detect slab outline",
    });
  }
});

// Production static assets
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SiteReady server running on port ${PORT}`);
});
