import { useEffect, useRef } from "react";
import { useCall } from "../../context/CallContext";
import {
  FaPhone,
  FaPhoneSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
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

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
const ringtoneRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-between py-16 text-white overflow-hidden">
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
          className="absolute top-6 right-6 w-28 h-40 rounded-xl object-cover border-2 border-white/30 shadow-lg z-10"
        />
      )}

      <div className="flex flex-col items-center gap-4 mt-10 relative z-10">
        {!(isVideoCall && callStatus === "connected") && (
          <div className="relative">
            <img
              src={
                remoteUser.profilePic || "/default-profile-picture.png"
              }
              alt={remoteUser.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
            />
            {(callStatus === "incoming" || callStatus === "outgoing") && (
              <span className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
            )}
          </div>
        )}

        <h2 className="text-2xl font-semibold drop-shadow">
          {remoteUser.name}
        </h2>

        <p className="text-gray-200 text-sm drop-shadow">
          {callStatus === "incoming" &&
            (isVideoCall
              ? "🎥 Incoming video call..."
              : "Incoming voice call...")}
          {callStatus === "outgoing" && "Calling..."}
          {callStatus === "connected" && formatDuration(callDuration)}
        </p>
      </div>

      <div className="flex items-center gap-8 mb-6 relative z-10">
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

            {isVideoCall && (
              <button
                onClick={toggleCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                  isCameraOff
                    ? "bg-white text-black"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                {isCameraOff ? (
                  <FaVideoSlash size={18} />
                ) : (
                  <FaVideo size={18} />
                )}
              </button>
            )}

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
