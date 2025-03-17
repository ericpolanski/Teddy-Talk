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
  const [alerts, setAlerts] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [transcripts, setTranscripts] = useState([]); // Store transcripts as an array
  const [flagged, setFlag] = useState(false);
  const [parentPhoneNumber, setParentPhoneNumber] = useState("");
  const [childName, setChildName] = useState("");
  const [showForm, setShowForm] = useState(true);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const [AI_Response, setAIResponse] = useState([]); // Initialize AI_Response as an array

  // Rules for how to converse with a child
  const AI_RULES = `
  How to Converse With A Child

  1. **Use Simple Words:** 
   - Make sure the child can understand. Educate in an approachable, relatable way.

  2. **Avoid The Word “Don't”:** 
   - Encourage positive behavior rather than scolding.
   - Example: Instead of “Don't run,” say “Let's walk safely!”

  3. **Encourage Autonomy & Curiosity:** 
   - Offer options and solutions rather than making decisions for them.
   - Ask follow-up questions to help them reflect and learn.

  4. **Encourage Cooperation:** 
   - Promote teamwork with friends, family, and trusted adults.
   - Encourage asking parents or teachers for guidance.

  5. **Foster Emotional Intelligence:** 
   - Help children recognize, name, and manage emotions.
   - Example: Instead of “You're fine,” say “I see you're feeling sad. What can we do to feel better?”

  6. **Make Learning Fun & Engaging:** 
   - Use storytelling, playful language, and excitement.
   - Example: Instead of “The sun gives us light,” say “The sun is like a big glowing flashlight in the sky!”

  7. **Reinforce Good Habits:** 
   - Model healthy routines in conversation.
   - Example: Instead of “You forgot to brush your teeth,” say “Brushing makes your smile super shiny! Show me how you do it!”

  8. **Be Adaptive & Personal:** 
   - Adjust responses based on the child's interests and previous conversations.
   - If they love animals, include animal-related examples.

  9. **Promote a Growth Mindset:** 
   - Encourage perseverance and learning from mistakes.
   - Example: Instead of “You got it wrong,” say “Great try! Let's figure it out together.”

  10. **Ensure a Safe & Supportive Environment:** 
   - Keep conversations safe, age-appropriate, and reassuring.
   - Avoid discussing complex or distressing topics.
  `;

  const [responseMessage, setResponseMessage] = useState("");

  const handleFormSubmit = async (formData) => {
    setParentPhoneNumber(formData.phoneNumber); 
    setChildName(formData.name);
    //console.log(`Child Name: ${formData.name}`)
    setShowForm(false); // Hide the form after submission
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
        Authorization: `Bearer $YOUR_API_KEY_HERE`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: transcript,
      }),
    });

  const result = await response.json();

  return result;
}

  async function handleFlaggedInput(moderationResult, text) {
    console.log("Handling flagged input:", text);
    let aiPrompt = `Follow these AI Communication Principles:\n${AI_RULES}\n\n`;

    if (moderationResult.results[0].categories.violence) {
      aiPrompt += `The user mentioned something violent: "${text}". Respond with a peaceful message.`;
    } else if (moderationResult.results[0].categories.hate) {
      aiPrompt += `The user used hateful language: "${text}". Respond with a kind and inclusive message.`;
    } else if (moderationResult.results[0].categories.sexual) {
      aiPrompt += `The user brought up something inappropriate: "${text}". Redirect to a child-friendly topic.`;
    } else if (moderationResult.results[0].categories.self_harm) {
      aiPrompt += `The user mentioned self-harm: "${text}". Provide encouragement and suggest talking to a trusted adult.`;
      await logConcerningMessage(text, "severe");
    } else if (moderationResult.results[0].categories.harassment) {
      aiPrompt += `The user is harassing: "${text}". Gently remind them to be respectful.`;
    }

    console.log("Generating a safe response...");
    const safeResponse = await processTextWithRules(aiPrompt);
    // setTranscript(safeResponse);
  }

  async function processTextWithRules(text) {
    const prompt = `Follow these AI Communication Principles:\n${AI_RULES}\n\nUser said: "${text}". Generate a child-friendly response.`;
    return await processText(prompt);
  }

  async function processText(text) {
    const response = await fetch("/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    return data.response;
  }

  // Improved logging function with error handling
  async function logConcerningMessage(userInput, severity) {
    try {
      await fetch("/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput, severity }),
      });
    } catch (error) {
      console.error("Logging error:", error);
    }
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
            //console.log(moderationResult.results);
            setFlag(moderationResult.results[0].flagged);
            if (moderationResult.results[0].flagged) {
              // await handleFlaggedInput(moderationResult, newTranscript);
              // Store true flagged categories in array
              const flaggedCategories = Object.keys(moderationResult.results[0].categories).filter(category => moderationResult.results[0].categories[category]);
              setAlerts(flaggedCategories.join(', '));
              // So the message is sent in the console as well
              // console.log(`Teddy Talk has detected the following flagged content: ${flaggedCategories.join(', ')}\nThis was the message said: ${newTranscript}\nReply STOP to stop receiving these messages.`);
              // Send a text message to the parent
              axios.post('/send-sms', {
                phone: parentPhoneNumber,
                message: `Teddy Talk has detected the following flagged content: ${flaggedCategories.join(', ')}\nThis was the message said: ${newTranscript}`,
              }).then(response => {
                console.log(response.data);
              })
            }
          } catch (error) {
            console.error("Moderation error:", error);
          }
        }

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
            topic = {alerts}
            events={events}
            isSessionActive={isSessionActive}
            transcript={transcripts[transcripts.length - 1]}
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