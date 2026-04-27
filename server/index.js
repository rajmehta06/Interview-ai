/**
 * server/index.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Lightweight Express proxy that keeps your Anthropic API key out of the
 * browser bundle. All Claude API calls from the React front-end go through
 * /api/claude and /api/claude-doc, which add the Authorization header
 * server-side before forwarding to api.anthropic.com.
 *
 * Start with:  node server/index.js          (production)
 *              nodemon server/index.js        (dev with auto-reload)
 */

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "20mb" })); // PDFs can be large as base64

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Text-only Claude call ──────────────────────────────────────────────────────
app.post("/api/claude", async (req, res) => {
  const { prompt, systemPrompt } = req.body;

  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  };
  if (systemPrompt) body.system = systemPrompt;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || "Upstream error" });
    }

    const text = data.content?.map(b => b.text || "").join("") || "";
    res.json({ text });
  } catch (err) {
    console.error("Claude API error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Document (PDF) Claude call ─────────────────────────────────────────────────
app.post("/api/claude-doc", async (req, res) => {
  const { base64, mimeType, userText, systemPrompt } = req.body;

  if (!base64 || !userText) {
    return res.status(400).json({ error: "base64 and userText are required" });
  }

  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: mimeType || "application/pdf",
              data: base64,
            },
          },
          { type: "text", text: userText },
        ],
      },
    ],
  };
  if (systemPrompt) body.system = systemPrompt;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || "Upstream error" });
    }

    const text = data.content?.map(b => b.text || "").join("") || "";
    res.json({ text });
  } catch (err) {
    console.error("Claude doc API error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Serve built React app in production ───────────────────────────────────────
app.use(express.static(join(__dirname, "../dist")));
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅  InterviewAI server running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  ANTHROPIC_API_KEY is not set — API calls will fail.");
  }
});
