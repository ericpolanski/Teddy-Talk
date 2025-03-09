import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import axios from "axios";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Middleware to parse JSON bodies
app.use(express.json());

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
          instructions: "You are a friendly AI assistant.",
          input_audio_transcription: {
            "model": "whisper-1",
          }
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// API route to send SMS
app.post("/send-sms", async (req, res) => {
  const { phone, message } = req.body;
  try {
    const response = await axios.post('https://textbelt.com/text', {
      phone: phone,
      message: message,
      key: 'b7e6a4bade4b29f1c256834a193e0aa6f3b3157eBRfuUb0OG6SCEtvnPMF3eM8a0_test',
    });

    res.json(response.data);
  } catch (error) {
    console.error("SMS sending error:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});


// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});