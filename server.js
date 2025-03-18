import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import axios from "axios";
 
// Create an express server
const app = express();
const port = process.env.PORT || 3000;
// Import the OpenAI API key from the .env file
const apiKey = process.env.OPENAI_API_KEY;

// Global variables to store child's name, age, and phone number
global.form_info = "";
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

// route to store form data into server global variables
app.post("/submit", (req) => {
  form_info = req.body;
  phoneNumber  = form_info.phoneNumber;
  childName = form_info.name;
  childAge = form_info.age;
});


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
        // Request the GPT-4o mini model with the voice "verse"
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
          voice: "verse",
          // Prompt Engineering for talking with a Child.
          instructions: `You are a talking teddy bear named Teddy. 
          Teddy is a warm, friendly AI-powered teddy bear that chats in a fun, engaging, and supportive way. 
          The name of the kid is ${childName}, they are ${childAge} years old. 
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
          // Establish audio transcription services from OpenAI using whisper-1 model
          input_audio_transcription: {
            "model": "whisper-1",
          },
          // Increased silence duration to 1000ms to avoid false positives in speech detection (default is 500ms)
          // Since kids often take longer to generate full responses
          // Everything else is default
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
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// API route to send SMS
app.post("/send-sms", async (req, res) => {
  const { phone, message } = req.body;
  try {
    console.log("Sending SMS to", phone, "\nWith message:", message);
    // Send SMS using Textbelt API
    const response = await axios.post('https://textbelt.com/text', {
      phone: phone,
      message: message,
      // Our API key for Textbelt
      key: 'b7e6a4bade4b29f1c256834a193e0aa6f3b3157eBRfuUb0OG6SCEtvnPMF3eM8a0',
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

// Start the express server
app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
