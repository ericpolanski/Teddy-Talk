import { useEffect, useRef, useState } from "react";
import logo from "/assets/TTLogo.png";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import axios from "axios";
import ChildInfoForm from "./ChildInfoForm";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [transcripts, setTranscripts] = useState([]); // Store transcripts as an array
  const [flagged, setFlag] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [parentPhoneNumber, setParentPhoneNumber] = useState("");
  const [showForm, setShowForm] = useState(true);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  const handleFormSubmit = ({ name, age, phoneNumber }) => {
    setChildName(name);
    setChildAge(age);
    setParentPhoneNumber(phoneNumber);
    setShowForm(false); // Hide the form after submission
  };

  async function startSession() {
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;
    const pc = new RTCPeerConnection();
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);
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
        "Content-Type": "application/sdp",
      },
    });
    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
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

  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("Failed to send message - no data channel available", message);
    }
  }

  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };
    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  async function moderateContent(transcript) {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: transcript,
      }),
    });
    const result = await response.json();
    return result;
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);
        setEvents((prev) => [event, ...prev]);

        if (event.type === "conversation.item.input_audio_transcription.completed") {
          const newTranscript = event.transcript;

          // Add new transcript to the array
          setTranscripts((prevTranscripts) => [...prevTranscripts, newTranscript]);

          try {
            const moderationResult = await moderateContent(newTranscript);
            console.log(moderationResult.results);
            setFlag(moderationResult.results[0].flagged);
          } catch (error) {
            console.error("Moderation error:", error);
          }
        }
      });

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px", marginLeft: "10px" }} src={logo} />
          <h1>Teddy Talk Console</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} 
                      transcripts={transcripts} 
                      flagged = {flagged} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
            transcript={transcripts}
            flagged={flagged}
          />
        </section>
      </main>
      {showForm && (
        <div className="flex justify-center items-center absolute top-0 left-0 right-0 bottom-0 border border-gray-50 p-4">
          <ChildInfoForm onSubmit={handleFormSubmit} />
        </div>
      )}
    </>
  );
}
