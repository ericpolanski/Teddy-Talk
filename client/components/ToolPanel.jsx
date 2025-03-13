import { useEffect, useState } from "react";

const functionDescription = `
Call this function when a flag is set by the Moderation API for concerning topics.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_alert",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            alertType: {
              type: "string",
              description: "Type of concerning topic detected (e.g., violence, self-harm).",
            },
            message: {
              type: "string",
              description: "Message to display about the detected issue.",
            },
          },
          required: ["alertType", "message"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function AlertNotification({ functionCallOutput, onClose }) {
  const { alertType, message } = JSON.parse(functionCallOutput.arguments);

  return (
    <div className="p-4 bg-red-200 border border-red-500 rounded-md relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-md"
      >
        ✕
      </button>
      <p className="text-lg font-bold">Alert: {alertType}</p>
      <p>{message}</p>
    </div>
  );
}


export default function ToolPanel({ isSessionActive, sendClientEvent, events, transcript, flagged }) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState({
    arguments: JSON.stringify({
      alertType: "Self-harm",
      message: "A message related to self-harm has been detected. Please review the conversation carefully.",
    }),
  });

  const handleClose = () => {
    setFunctionCallOutput(null); // Clears the notification
  };



  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[0];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[events.length - 1];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "display_alert") {
          setFunctionCallOutput(output);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Welcome to Teddy Talk!</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <AlertNotification functionCallOutput={functionCallOutput} onClose = {handleClose} />
          ) : (
            <p>No concerning topics detected.</p>
          )
        ) : (
          <p>When inappropriate topics are brought up, notifications will appear below.</p>
        )}
        
      </div>

      {/* Transcript Section at the Bottom */}
      <div className="mt-auto pt-4 border-t border-gray-300">
          <h2 className="text-md font-semibold">Transcript</h2>
          <p className="text-sm">{transcript || "No transcript available."}</p>
                    
          <h2 className="text-md font-semibold mt-2">Flagged Topic?</h2>
          <p className="text-sm text-red-500">{flagged.toString()}</p>
      </div>


    </section>
  );

}