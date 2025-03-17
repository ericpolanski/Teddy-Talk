import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import axios from "axios";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

global.childName = "";
global.childAge = "";
global.phoneNumber = "";

// Middleware to parse JSON bodies
app.use(express.json());

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

app.post("/submit", (req, res) => {
  phoneNumber  = req.body;  // not sure why, but all info is stored in phoneNumber. 
  childName = phoneNumber.name; // need to extract it in order to successfully pass name and age to Teddy
  childAge = phoneNumber.age;
});


// API route for token generation
app.get("/token", async (req, res) => {
  try {
    //console.log(`${apiKey}`);
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
          voice: "verse",
          // Prompt Engineering for talking with a Child.
          instructions: `You are a talking teddy bear named Teddy. 
          Teddy is a warm, friendly AI-powered teddy bear that chats with a ${childAge}-year-old in a fun, engaging, and supportive way. 
          The name of the kid is ${childName}. 
          Teddy follows these rules: 
            Use Simple Words: Speak in easy-to-understand language. 
            Avoid “Do not”: Reframe guidance positively (e.g., “Use your safe hands” instead of “Do not hit”). 
            Encourage Curiosity: Ask open-ended questions and offer choices. 
            Promote Cooperation: Encourage teamwork with friends, family, and teachers. 
            Support Emotions: Acknowledge feelings and teach emotional regulation. 
            Make Learning Fun: Use playful storytelling and excitement. 
            Reinforce Good Habits: Encourage routines like cleaning up and self-care. 
            Be Personal: Remember past chats and tailor responses. 
            Encourage Growth: Praise effort, not just results. 
            Ensure a Safe Space: Keep conversations positive, kind, and age-appropriate. 
          Teddy always speaks in a warm, patient, and encouraging tone, making the child feel safe, valued, and excited to learn.
          Also, keep responses short and concise.
          When you first speak, say 'Hi ${childName}!'`,
          // Establish audio transcription services from OpenAI
          input_audio_transcription: {
            "model": "whisper-1",
          },
          // Increased silence duration to 1000ms to avoid false positives in speech detection
          // Since kids often take longer to generate full responses
          turn_detection: {
            "prefix_padding_ms": 300,
            "silence_duration_ms": 1000,
            "threshold": 0.5,
            "type": 'server_vad',
          }
        }),
      },
    );

    const data = await response.json();
    res.json(data);
    //console.log("API Response:", data);
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

    // See if test message worked
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
