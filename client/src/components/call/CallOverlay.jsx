import { useEffect, useRef } from "react";
import { useCall } from "../../context/CallContext";
import { useTheme } from "../../context/ThemeContext";
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo,
  FaVideoSlash,
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
    callType,
    remoteUser,
    callDuration,
    isMuted,
    isCameraOff,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  const { theme } = useTheme();
const isDark = theme === "dark";

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
const ringtoneRef = useRef(null);

 useEffect(() => {
  if (localVideoRef.current && localStream) {
    localVideoRef.current.srcObject = localStream;

    localVideoRef.current.play().catch((err) => {
      console.log("Local video play blocked:", err);
    });
  }
}, [localStream, callStatus]);

useEffect(() => {
  if (remoteVideoRef.current && remoteStream) {
    remoteVideoRef.current.srcObject = remoteStream;

    remoteVideoRef.current.play().catch((err) => {
      console.log("Remote video play blocked:", err);
    });
  }
}, [remoteStream, callStatus]);

  useEffect(() => {
  const ringtone = ringtoneRef.current;

  if (!ringtone) return;

  if (
    callStatus === "outgoing" ||
    callStatus === "incoming"
  ) {
    ringtone.currentTime = 0;
    ringtone.play().catch((err) => {
      console.log("Ringtone autoplay blocked:", err);
    });
  } else {
    ringtone.pause();
    ringtone.currentTime = 0;
  }

  return () => {
    ringtone.pause();
    ringtone.currentTime = 0;
  };
}, [callStatus]);

  if (callStatus === "idle" || !remoteUser) return null;

  const isVideoCall = callType === "video";
  const showLocalPreview =
    isVideoCall && localStream && callStatus !== "incoming";

  return (
   <div
  className={`fixed inset-0 z-[100] flex flex-col items-center justify-between py-8 transition-colors duration-300 ${
    isDark
      ? "bg-black text-white"
      : "bg-white text-gray-900"
  }`}
>
          <audio
  ref={ringtoneRef}
  src="/ringtone.mp3"
  loop
  preload="auto"
/>

      {isVideoCall && callStatus === "connected" && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {showLocalPreview && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
         className="absolute top-4 right-4 w-20 h-28 sm:top-6 sm:right-6 sm:w-28 sm:h-40 rounded-xl object-cover border-2 border-white/30 shadow-lg z-10"
      />
      )}

<div className="flex flex-col items-center gap-3 sm:gap-4 mt-6 sm:mt-10 px-4 relative z-10">
          {!(isVideoCall && callStatus === "connected") && (
          <div className="relative">
            <img
              src={
                remoteUser.profilePic || "/default-profile-picture.png"
              }
              alt={remoteUser.name}
              
 className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/20" />
             {(callStatus === "incoming" || callStatus === "outgoing") && (
              <span className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
            )}
          </div>
        )}

        <h2
  className={`text-xl sm:text-2xl font-semibold drop-shadow text-center ${
    isDark ? "text-white" : "text-gray-900"
  }`}
>
          {remoteUser.name}
        </h2>

        <p
  className={`text-xs sm:text-sm drop-shadow text-center ${
    isDark ? "text-gray-300" : "text-gray-600"
  }`}
>
          {callStatus === "incoming" &&
            (isVideoCall
              ? "🎥 Incoming video call..."
              : "Incoming voice call...")}
          {callStatus === "outgoing" && "Calling..."}
          {callStatus === "connected" && formatDuration(callDuration)}
        </p>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 mb-4 sm:mb-6 px-4 relative z-10">
  {callStatus === "incoming" ? (
    <>
      <button
        onClick={rejectCall}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
      >
        <FaPhoneSlash size={20} />
      </button>

      <button
        onClick={acceptCall}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition animate-bounce"
      >
        <FaPhone size={20} />
      </button>
    </>
  ) : (
    <>
      <button
        onClick={toggleMute}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition ${
         isMuted
  ? isDark
    ? "bg-white text-black"
    : "bg-gray-900 text-white"
  : isDark
    ? "bg-white/20 hover:bg-white/30 text-white"
    : "bg-black/10 hover:bg-black/20 text-gray-900"
   }`}
      >
        {isMuted ? (
          <FaMicrophoneSlash size={16} />
        ) : (
          <FaMicrophone size={16} />
        )}
      </button>

      {isVideoCall && (
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition ${
           isCameraOff
  ? isDark
    ? "bg-white text-black"
    : "bg-gray-900 text-white"
  : isDark
    ? "bg-white/20 hover:bg-white/30 text-white"
    : "bg-black/10 hover:bg-black/20 text-gray-900"
  }`}
        >
          {isCameraOff ? (
            <FaVideoSlash size={16} />
          ) : (
            <FaVideo size={16} />
          )}
        </button>
      )}

      <button
        onClick={endCall}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
      >
        <FaPhoneSlash size={20} />
      </button>
    </>
  )}
</div>
    </div>
  );
}

export default CallOverlay;
