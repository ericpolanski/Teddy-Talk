export default function EventLog({ transcripts }) {
  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      {transcripts.length === 0 ? (
        <div className="text-gray-500">Awaiting user message...</div>
      ) : (
        transcripts.map((message, index) => (
          <div key={index} className="p-2 rounded-md bg-gray-50">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-500">{message}</div>
              <div className="text-xs text-gray-400">
                {new Date().toLocaleTimeString()} {/* Timestamp */}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}