export default function ToolPanel({ isSessionActive, transcript, flagged, topic }) {
  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Welcome to Teddy Talk!</h2>

        {flagged ? (
          <div className="mt-4 p-4 bg-red-200 border border-red-500 rounded-md">
            <p className="text-lg font-bold">Alert: Teddy detected {topic} </p>
            <p> Teddy has detected {topic} in the following message:
              <br />
              <em>{transcript}</em> </p>
          </div>
        ) : (
          <p>No concerning topics detected.</p>
        )}
      </div>

      {/* Transcript Section */}
      <div className="mt-auto pt-4 border-t border-gray-300">
        <h2 className="text-md font-semibold">Transcript</h2>
        <p className="text-sm">{transcript || "No transcript available."}</p>

        <h2 className="text-md font-semibold mt-2">Flagged Topic?</h2>
        <p className="text-sm text-red-500">{flagged ? "Yes" : "No"}</p>
      </div>
    </section>
  );
}
