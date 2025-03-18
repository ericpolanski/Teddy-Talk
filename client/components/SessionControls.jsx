import { useState } from "react";
import { Play, Pause } from "react-feather";
import Button from "./Button";


// Handles deactivation of session
function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  // Change the button accordingly
  return (
      <Button
        onClick={handleStartSession}
        className={isActivating ? "bg-gray-600" : "bg-red-600"}
        icon={<Play height={16} />}
      >
        {isActivating ? "Starting Session..." : "Start Session"}
      </Button>
  );
}
// Handles activation of session
function SessionActive({ stopSession }) {
  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <Button onClick={stopSession} icon={<Pause height={16} />}>
        Disconnect
      </Button>
    </div>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  isSessionActive,
}) {
  // Show the appropriate session control based on the session state
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive stopSession={stopSession} />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}