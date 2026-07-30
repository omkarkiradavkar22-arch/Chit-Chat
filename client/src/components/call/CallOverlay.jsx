import { useCall } from "../../context/CallContext";
import {
  FaPhone,
  FaPhoneSlash,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function CallOverlay() {
  const {
    callStatus,
    remoteUser,
    callDuration,
    isMuted,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  } = useCall();

  if (callStatus === "idle" || !remoteUser) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-between py-16 text-white">
      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="relative">
          <img
            src={
              remoteUser.profilePic ||
              "https://placehold.co/160x160?text=User"
            }
            alt={remoteUser.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
          />
          {(callStatus === "incoming" || callStatus === "outgoing") && (
            <span className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
          )}
        </div>

        <h2 className="text-2xl font-semibold">{remoteUser.name}</h2>

        <p className="text-gray-300 text-sm">
          {callStatus === "incoming" && "Incoming voice call..."}
          {callStatus === "outgoing" && "Calling..."}
          {callStatus === "connected" && formatDuration(callDuration)}
        </p>
      </div>

      <div className="flex items-center gap-8 mb-6">
        {callStatus === "incoming" ? (
          <>
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
            >
              <FaPhoneSlash size={22} />
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition animate-bounce"
            >
              <FaPhone size={22} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                isMuted
                  ? "bg-white text-black"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isMuted ? (
                <FaMicrophoneSlash size={18} />
              ) : (
                <FaMicrophone size={18} />
              )}
            </button>
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
            >
              <FaPhoneSlash size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CallOverlay;