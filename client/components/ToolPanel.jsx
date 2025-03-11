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


export default function ToolPanel({ isSessionActive, sendClientEvent, events }) {
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

  <button
  onClick={() =>
    setFunctionCallOutput({
      arguments: JSON.stringify({
        alertType: "Violence",
        message: "A message related to violence has been detected. Please review the conversation carefully.",
      }),
    })
  }
  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
  >
  Show Test Notification
  </button>


  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
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

        {/* Test Notification Button */}
        {functionCallOutput === null && (
        <button
          onClick={() =>
            setFunctionCallOutput({
              arguments: JSON.stringify({
                alertType: "Violence",
                message: "Kevin brought up violence. See the transcription to the left.",
              }),
            })
          }
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Show Test Notification
        </button>
        )}
      </div>
    </section>
  );

}
