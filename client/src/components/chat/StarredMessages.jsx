if (msg.text) return msg.text;

const type = msg.attachments?.[0]?.type;

if (type === "image") {
  return (
    <span className="inline-flex items-center gap-1">
      <FaCamera />
      Photo
    </span>
  );
}

if (type === "video") {
  return (
    <span className="inline-flex items-center gap-1">
      <FaVideo />
      Video
    </span>
  );
}

if (type === "audio") {
  return (
    <span className="inline-flex items-center gap-1">
      <FaMicrophone />
      Voice message
    </span>
  );
}

if (type === "file") {
  return (
    <span className="inline-flex items-center gap-1">
      <FaFileAlt />
      File
    </span>
  );
}

return "Message";
