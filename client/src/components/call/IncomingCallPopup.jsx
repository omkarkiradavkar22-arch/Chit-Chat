import { Phone, PhoneOff, Video } from "lucide-react";
import { useCall } from "../../context/CallContext";

const IncomingCallPopup = () => {
  const {
    callStatus,
    callType,
    remoteUser,
    acceptCall,
    rejectCall,
  } = useCall();

  if (callStatus !== "incoming" || !remoteUser) {
    return null;
  }

  const profilePic =
    remoteUser.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      remoteUser.name || "User"
    )}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[90%] max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl text-center">

        {/* Profile Photo */}
        <img
          src={profilePic}
          alt={remoteUser.name}
          className="mx-auto h-28 w-28 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
        />

        {/* Caller Name */}
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {remoteUser.name || "Unknown User"}
        </h2>

        {/* Call Type */}
        <div className="mt-2 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          {callType === "video" ? (
            <>
              <Video size={18} />
              <span>Incoming video call...</span>
            </>
          ) : (
            <>
              <Phone size={18} />
              <span>Incoming audio call...</span>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-8 flex items-center justify-center gap-16">

          {/* Reject */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
            >
              <PhoneOff size={28} />
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-300">
              Decline
            </span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600"
            >
              {callType === "video" ? (
                <Video size={28} />
              ) : (
                <Phone size={28} />
              )}
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-300">
              Accept
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;