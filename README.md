# Teddy Talk
![Teddy Talk Thumbnail](TeddyTalkThumbnail.png)

Teddy Talk is an innovative React application that leverages the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) and [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc) to enable real-time communication with children via a teddy bear. This app provides an engaging and interactive experience while ensuring a safe environment by moderating content and notifying caretakers of harmful information. 

## Features

- **Realtime Communication**: Uses OpenAI's Realtime API and WebRTC to enable seamless interaction through a teddy bear interface.
- **Content Moderation**: Automatically analyzes text transcripts using the OpenAI Moderation API to detect harmful or inappropriate content.
- **Text Notifications**: Sends alerts to caretakers when harmful information is communicated, ensuring safety and peace of mind.
- **Conversation Viewer**: View messages sent between the child and the Teddy Bear through the console.

## OpenAI Realtime Console

The starter code comes from [OpenAI Realtime Console](https://github.com/openai/openai-realtime-console).
This is an example application showing how to use the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) with [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc).

## Installation and usage

Before you begin, you'll need an OpenAI API key - [create one in the dashboard here](https://platform.openai.com/settings/api-keys). Create a `.env` file from the example file and set your API key in there:

```bash
cp .env.example .env
```
Additionally, you will need to add the your API key to [`./client/components/App.jsx`](./client/components/App.jsx) on line 114
```jsx
  async function moderateContent(transcript) {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        // Change the API key to your OpenAI moderation API key
        Authorization: `Bearer $YOUR API KEY`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Give the moderation API the text transcript to analyze (cannot handle audio files)
        input: transcript,
      }),
    });
```

Running this application locally requires [Node.js](https://nodejs.org/) to be installed. Install dependencies for the application with:

```bash
npm install
```

Start the application server with:

```bash
npm run dev
```

This should start the console application on [http://localhost:3000](http://localhost:3000).

This application is a minimal template that uses [express](https://expressjs.com/) to serve the React frontend contained in the [`/client`](./client) folder. The server is configured to use [vite](https://vitejs.dev/) to build the React frontend.

This application shows how to send and receive Realtime API events over the WebRTC data channel and configure client-side function calling. You can also view the JSON payloads for client and server events using the logging panel in the UI.

## License

MIT
