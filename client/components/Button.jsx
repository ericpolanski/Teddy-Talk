export default function Button({ icon, children, onClick, className }) {
  // Button component
  return (
    <div className="flex items-center justify-center w-full h-full">
      <button
        className={`bg-gray-800 text-white rounded-full p-4 flex items-center gap-1 hover:opacity-90 ${className}`}
        onClick={onClick}
      >
        {icon}
        {children}
      </button>
    </div>
  );
}