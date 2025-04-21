import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { Play, Pause } from "react-feather";
import axios from "axios";
const logo = "/assets/TTLogo-BBwE3e3D.png";
function EventLog({ transcripts, AIresponse, name }) {
  const combinedMessages = transcripts.map((message, index) => ({
    userMessage: message,
    aiMessage: AIresponse[index] || ""
    // Handle cases where AI response might not be available
  }));
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2 overflow-x-auto", children: combinedMessages.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Awaiting messages..." }) : combinedMessages.map((messagePair, index) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 p-2 rounded-md bg-gray-50", children: [
      /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-gray-600", children: name }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 w-full", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-500", children: messagePair.userMessage }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-400", children: [
          (/* @__PURE__ */ new Date()).toLocaleTimeString(),
          " "
        ] })
      ] }) })
    ] }),
    messagePair.aiMessage && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 p-2 rounded-md bg-gray-50", children: [
      /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-gray-600 text-right", children: "Teddy" }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 w-full text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-500", children: messagePair.aiMessage }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-400", children: [
          (/* @__PURE__ */ new Date()).toLocaleTimeString(),
          " "
        ] })
      ] }) })
    ] })
  ] }, index)) });
}
function Button({ icon, children, onClick, className }) {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-full h-full", children: /* @__PURE__ */ jsxs(
    "button",
    {
      className: `bg-gray-800 text-white rounded-full p-4 flex items-center gap-1 hover:opacity-90 ${className}`,
      onClick,
      children: [
        icon,
        children
      ]
    }
  ) });
}
function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);
  function handleStartSession() {
    if (isActivating) return;
    setIsActivating(true);
    startSession();
  }
  return /* @__PURE__ */ jsx(
    Button,
    {
      onClick: handleStartSession,
      className: isActivating ? "bg-gray-600" : "bg-red-600",
      icon: /* @__PURE__ */ jsx(Play, { height: 16 }),
      children: isActivating ? "Starting Session..." : "Start Session"
    }
  );
}
function SessionActive({ stopSession }) {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-full h-full gap-4", children: /* @__PURE__ */ jsx(Button, { onClick: stopSession, icon: /* @__PURE__ */ jsx(Pause, { height: 16 }), children: "Disconnect" }) });
}
function SessionControls({
  startSession,
  stopSession,
  isSessionActive
}) {
  return /* @__PURE__ */ jsx("div", { className: "flex gap-4 border-t-2 border-gray-200 h-full rounded-md", children: isSessionActive ? /* @__PURE__ */ jsx(SessionActive, { stopSession }) : /* @__PURE__ */ jsx(SessionStopped, { startSession }) });
}
function ToolPanel({ isSessionActive, transcript, flagged, topic }) {
  return /* @__PURE__ */ jsx("section", { className: "h-full w-full flex flex-col gap-4", children: /* @__PURE__ */ jsxs("div", { className: "h-full bg-gray-50 rounded-md p-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: "Welcome to Teddy Talk!" }),
    flagged ? /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-red-200 border border-red-500 rounded-md", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold", children: [
        "Alert: Teddy detected ",
        topic,
        " "
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        " Teddy has detected ",
        topic,
        " in the following message:",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("em", { children: transcript }),
        " "
      ] })
    ] }) : /* @__PURE__ */ jsx("p", { children: "No concerning topics detected." })
  ] }) });
}
function ChildInfoForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, age, phoneNumber });
  };
  return (
    // Displayed form for child info
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-6 rounded-md shadow-md", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("label", { className: "block text-gray-700", children: [
        "Child's Name:",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            required: true,
            className: "mt-1 p-2 border border-gray-300 rounded-md w-full"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("label", { className: "block text-gray-700", children: [
        "Child's Age:",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            value: age,
            onChange: (e) => setAge(e.target.value),
            required: true,
            className: "mt-1 p-2 border border-gray-300 rounded-md w-full"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("label", { className: "block text-gray-700", children: [
        "Parent's Phone Number:",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "tel",
            value: phoneNumber,
            onChange: (e) => setPhoneNumber(e.target.value),
            required: true,
            className: "mt-1 p-2 border border-gray-300 rounded-md w-full"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "bg-blue-400", children: "Submit" })
    ] })
  );
}
function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [AI_Response, setAIResponse] = useState([]);
  const [flagged, setFlag] = useState(false);
  const [alerts, setAlerts] = useState("");
  const [parentPhoneNumber, setParentPhoneNumber] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [responseMessage, setResponseMessage] = useState("");
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const handleFormSubmit = async (formData) => {
    setParentPhoneNumber(formData.phoneNumber);
    setChildName(formData.name);
    setChildAge(formData.age);
    setShowForm(false);
    try {
      const response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setResponseMessage(data.message);
    } catch (error) {
      console.error("Error submitting form:", error);
      setResponseMessage("Failed to submit form.");
    }
  };
  async function startSession() {
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;
    const pc = new RTCPeerConnection();
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => audioElement.current.srcObject = e.streams[0];
    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(ms.getTracks()[0]);
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp"
      }
    });
    const answer = {
      type: "answer",
      sdp: await sdpResponse.text()
    };
    await pc.setRemoteDescription(answer);
    peerConnection.current = pc;
  }
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }
  async function moderateContent(transcript) {
    const res = await fetch("/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript })
    });
    return res.json();
  }
  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);
        setEvents((prev) => [event, ...prev]);
        if (event.type === "conversation.item.input_audio_transcription.completed") {
          const newTranscript = event.transcript;
          setTranscripts((prevTranscripts) => [...prevTranscripts, newTranscript]);
          try {
            const moderationResult = await moderateContent(newTranscript);
            setFlag(moderationResult.results[0].flagged);
            if (moderationResult.results[0].flagged) {
              const flaggedCategories = Object.keys(moderationResult.results[0].categories).filter((category) => moderationResult.results[0].categories[category]);
              setAlerts(flaggedCategories.join(", "));
              axios.post("/send-sms", {
                phone: parentPhoneNumber,
                message: `Teddy Talk has detected the following flagged content: ${flaggedCategories.join(", ")}
This was the message said: ${newTranscript}`
              }).then((response) => {
                console.log(response.data);
              });
            }
          } catch (error) {
            console.error("Moderation error:", error);
          }
        }
        if (event.type === "response.done") {
          console.log(event.response);
          const newAIResponse = event.response.output[0].content[0].transcript;
          setAIResponse((prevAIResponses) => [...prevAIResponses, newAIResponse]);
        }
      });
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("nav", { className: "absolute top-0 left-0 right-0 h-16 flex items-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200", children: [
      /* @__PURE__ */ jsx("img", { style: { width: "48px", marginLeft: "10px" }, src: logo }),
      /* @__PURE__ */ jsx("h1", { children: "Teddy Talk Console" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "absolute top-16 left-0 right-0 bottom-0", children: [
      /* @__PURE__ */ jsxs("section", { className: "absolute top-0 left-0 right-[380px] bottom-0 flex", children: [
        /* @__PURE__ */ jsx("section", { className: "absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto", children: /* @__PURE__ */ jsx(
          EventLog,
          {
            transcripts,
            AIresponse: AI_Response,
            flagged,
            name: childName
          }
        ) }),
        /* @__PURE__ */ jsx("section", { className: "absolute h-32 left-0 right-0 bottom-0 p-4", children: /* @__PURE__ */ jsx(
          SessionControls,
          {
            startSession,
            stopSession,
            events,
            isSessionActive
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto", children: /* @__PURE__ */ jsx(
        ToolPanel,
        {
          topic: alerts,
          events,
          transcript: transcripts[transcripts.length - 1],
          flagged
        }
      ) })
    ] }),
    showForm && /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center absolute top-0 left-0 right-0 bottom-0 border border-gray-50 p-4", children: /* @__PURE__ */ jsx(ChildInfoForm, { onSubmit: handleFormSubmit }) })
  ] });
}
function render() {
  const html = renderToString(
    /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(App, {}) })
  );
  return { html };
}
export {
  render
};
