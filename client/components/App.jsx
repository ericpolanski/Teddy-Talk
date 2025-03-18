import { useEffect, useRef, useState } from "react";
import logo from "/assets/TTLogo.png";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import axios from "axios";
import ChildInfoForm from "./ChildInfoForm";

export default function App() {
  // Stores all important information about the operations of the application
  // local state variables
  const [isSessionActive, setIsSessionActive] = useState(false); // boolean: check session activity
  const [events, setEvents] = useState([]); // array: store all server and client events
  const [dataChannel, setDataChannel] = useState(null); // object: store data channel (for audio)
  const [transcripts, setTranscripts] = useState([]); // array: store all user input transcripts
  const [AI_Response, setAIResponse] = useState([]); // array: store all AI responses
  const [flagged, setFlag] = useState(false); // boolean: check if moderation API flags content
  const [alerts, setAlerts] = useState(""); // string: store flagged categories
  const [parentPhoneNumber, setParentPhoneNumber] = useState(""); // string: store parent phone number from form
  const [childName, setChildName] = useState(""); // string: store child name from form
  const [childAge, setChildAge] = useState(""); // string: store child age from form
  const [showForm, setShowForm] = useState(true); // boolean: show form to input child info
  const [responseMessage, setResponseMessage] = useState(""); // string: store response message from form submission
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  const handleFormSubmit = async (formData) => {
    // From user input, set the parent phone number and child name
    setParentPhoneNumber(formData.phoneNumber); 
    setChildName(formData.name);
    setChildAge(formData.age);
    // Hide the form after submission
    setShowForm(false);
    // Send to server
    try {
      const response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResponseMessage(data.message);
    } catch (error) {
      console.error("Error submitting form:", error);
      setResponseMessage("Failed to submit form.");
    }
  };

  async function startSession() {
    // Fetch the token from the server
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;
    // Create a new peer connection
    // This application uses WebRTC to establish a peer-to-peer connection
    const pc = new RTCPeerConnection();
    // Create an audio element to play the audio stream
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
    // Using the GPT-4o mini model
    const model = "gpt-4o-mini-realtime-preview-2024-12-17";
    // Send the offer to the OpenAI API
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
    // Close the data channel and peer connection
    if (dataChannel) {
      dataChannel.close();
    }
    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });
    // Close the peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
    }
     // set all relevant states to null or false
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Function to call the OpenAI's moderation API
  async function moderateContent(transcript) {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        // Change the API key to your OpenAI moderation API key
        Authorization: `Bearer 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`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Give the moderation API the text transcript to analyze (cannot handle audio files)
        input: transcript,
      }),
    });
// Parse the response from the moderation API
  const result = await response.json();

  return result;
}

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", async (e) => {
        // Parse event server and client message
        const event = JSON.parse(e.data);
        // set the event to the top of the array
        setEvents((prev) => [event, ...prev]);

        // Check if the event is a completed audio transcription
        // If so, send the transcript to the moderation API and check for flagged content
        if (event.type === "conversation.item.input_audio_transcription.completed") {
          const newTranscript = event.transcript;

          // Add new transcript to the array
          setTranscripts((prevTranscripts) => [...prevTranscripts, newTranscript]);
          try {
            const moderationResult = await moderateContent(newTranscript);
            setFlag(moderationResult.results[0].flagged);
            // If content is flagged, pull out flagged categories and send a text message to the parent
            if (moderationResult.results[0].flagged) {
              // Store true flagged categories in array
              const flaggedCategories = Object.keys(moderationResult.results[0].categories).filter(category => moderationResult.results[0].categories[category]);
              setAlerts(flaggedCategories.join(', '));
              // Debug Line: See sent message in the console
              // console.log(`Teddy Talk has detected the following flagged content: ${flaggedCategories.join(', ')}\nThis was the message said: ${newTranscript}\nReply STOP to stop receiving these messages.`);
              // Send a text message to the parent
              axios.post('/send-sms', {
                phone: parentPhoneNumber,
                message: `Teddy Talk has detected the following flagged content: ${flaggedCategories.join(', ')}\nThis was the message said: ${newTranscript}`,
              }).then (response => {
                console.log(response.data);
              })
            }
          } catch (error) {
            console.error("Moderation error:", error);
          }
        }

        // Grab the AI response for console display
        if (event.type === "response.done") {
          const newAIResponse = event.response.output[0].content[0].transcript;

          // Add new AI response to the array
          setAIResponse((prevAIResponses) => [...prevAIResponses, newAIResponse]);
        }
      });

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  // HTML structure for the application
  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        { /* Logo and title */ }
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "48px", marginLeft: "10px" }} src={logo} />
          <h1>Teddy Talk Console</h1>
        </div>
      </nav>
      { /* Main content of the application */ }
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog 
              transcripts={transcripts}
              AIresponse={AI_Response}
              flagged={flagged}
              name = {childName} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <ToolPanel
            topic = {alerts}
            events={events}
            transcript={transcripts[transcripts.length - 1]}
            flagged={flagged}
          />
        </section>
      </main>
      {/* Show the form to input child information */}
      {showForm && (
        <div className="flex justify-center items-center absolute top-0 left-0 right-0 bottom-0 border border-gray-50 p-4">
          <ChildInfoForm onSubmit={handleFormSubmit} />
        </div>
      )}
    </>
  );
}