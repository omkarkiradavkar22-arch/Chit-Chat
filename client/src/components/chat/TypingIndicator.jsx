function TypingIndicator({ typingUser }) {
  if (!typingUser) return null;

  return (
    <div className="px-5 py-2 text-sm text-gray-500 italic">
      {typingUser} is typing...
    </div>
  );
}

export default TypingIndicator;