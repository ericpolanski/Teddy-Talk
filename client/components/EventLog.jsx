export default function EventLog({ transcripts, AIresponse, name }) {
  // Combine transcripts and AI responses into a single array of objects
  const combinedMessages = transcripts.map((message, index) => ({
    userMessage: message,
    aiMessage: AIresponse[index] || "", // Handle cases where AI response might not be available
  }));

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      {combinedMessages.length === 0 ? (
        <div className="text-gray-500">Awaiting messages...</div>
      ) : (
        combinedMessages.map((messagePair, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 p-2 rounded-md bg-gray-50">
              <div className="text-lg font-bold text-gray-600">{name}</div>
              <div className="flex justify-start">
                <div className="flex flex-col gap-1 w-full">
                  <div className="text-sm text-gray-500">{messagePair.userMessage}</div>
                  <div className="text-xs text-gray-400">
                    {new Date().toLocaleTimeString()} {/* Timestamp */}
                  </div>
                </div>
              </div>
            </div>
            {messagePair.aiMessage && (
              <div className="flex flex-col gap-1 p-2 rounded-md bg-gray-50">
                <div className="text-lg font-bold text-gray-600 text-right">Teddy</div>
                <div className="flex justify-end">
                  <div className="flex flex-col gap-1 w-full text-right">
                    <div className="text-sm text-gray-500">{messagePair.aiMessage}</div>
                    <div className="text-xs text-gray-400">
                      {new Date().toLocaleTimeString()} {/* Timestamp */}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}