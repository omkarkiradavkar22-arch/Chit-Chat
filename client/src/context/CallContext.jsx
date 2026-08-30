import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

const CallContext = createContext();

// STUN alone fails on mobile data / restrictive NATs — TURN is required
// as a fallback relay. Replace these with your own TURN provider
// (Twilio, Metered.ca, Xirsys) creds via env vars in production.
// The openrelay.metered.ca creds below are public/free and fine for
// testing, but are rate-limited — don't rely on them for production.
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // idle | outgoing | incoming | connected
  const [callStatus, setCallStatus] = useState("idle");
  // 'audio' | 'video'
  const [callType, setCallType] = useState("audio");
  const [remoteUser, setRemoteUser] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  // Actual MediaStream objects — components (CallOverlay) read these
  // and attach them to <video>/<audio> elements via refs.
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null); // used only for audio-only calls
  const durationTimerRef = useRef(null);
  const autoEndCallTimerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const incomingCallRef = useRef(null); // { from, offer, type, chatId }
  const ringtoneRef = useRef(null);
  const endCallRef = useRef(null); // set once endCall is defined below

  const cleanup = useCallback(() => {

    // 🔇 Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    clearInterval(durationTimerRef.current);
    if (autoEndCallTimerRef.current) {
      clearTimeout(autoEndCallTimerRef.current);
      autoEndCallTimerRef.current = null;
    }
    pendingCandidatesRef.current = [];
    incomingCallRef.current = null;
    setCallDuration(0);
    setCallStatus("idle");
    setCallType("audio");
    setRemoteUser(null);
    setActiveChatId(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const createPeerConnection = useCallback(
    (targetUserId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            to: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];

        setRemoteStream(stream);

        // For audio-only calls there's no <video> element bound in the
        // overlay, so play sound through this always-mounted <audio> tag.
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
        }
      };

      // Without this, a dropped connection (network change, other side's
      // wifi dying, etc.) leaves the UI stuck showing "connected" with
      // dead audio/video forever — nothing else was watching for it.
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log("ICE connection state:", state);

        if (state === "disconnected") {
          // Give it a few seconds to recover on its own (brief network
          // blips are common) before trying anything drastic.
          setTimeout(() => {
            if (pcRef.current === pc && pc.iceConnectionState === "disconnected") {
              pc.restartIce?.();
            }
          }, 3000);
        }

        if (state === "failed" || state === "closed") {
          endCallRef.current?.();
        }
      };

      return pc;
    },
    [socket]
  );

  const startDurationTimer = () => {
    clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const getMedia = (type) =>
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { facingMode: "user" } : false,
    });

  // ---- Caller: start an outgoing call ----
  // type: "audio" | "video"
  const startCall = useCallback(
    async (otherUser, type = "audio", chatId) => {
      if (!socket || !user || callStatus !== "idle") return;

      try {
        const stream = await getMedia(type);
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = createPeerConnection(otherUser._id);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        setRemoteUser(otherUser);
        setActiveChatId(chatId);
        setCallType(type);
        setCallStatus("outgoing");

        socket.emit("call:invite", {
          to: otherUser._id,
          from: user._id,
          fromName: user.name,
          fromPic: user.profilePic,
          callType: type,
          offer,
          chatId,
        });

        // Auto end outgoing call after 30 seconds if not answered
        if (autoEndCallTimerRef.current) {
          clearTimeout(autoEndCallTimerRef.current);
        }

        autoEndCallTimerRef.current = setTimeout(() => {
          socket.emit("call:end", {
            to: otherUser._id,
            chatId,
            from: user._id,
            callType: type,
            callDuration: 0,
            wasAnswered: false,

            // Important
            reason: "missed",
            endedBy: user._id,
          });

          cleanup();
        }, 30000);

      } catch (err) {
        console.error("Failed to start call:", err);
      }
    },
    [socket, user, callStatus, createPeerConnection]
  );

  // ---- Callee: accept the incoming call ----
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCallRef.current) return;

    // 🔇 Stop ringtone when call is accepted
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }

    const {
      from,
      offer,
      type,
      chatId,
    } = incomingCallRef.current;

    try {
      const stream = await getMedia(type);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(from);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:accept", {
        to: from,
        answer,
        chatId,
        from: user._id,
        callType: type,
      });

      setCallStatus("connected");
      startDurationTimer();

      // Call answered — cancel 30 sec ringing timeout
      if (autoEndCallTimerRef.current) {
        clearTimeout(autoEndCallTimerRef.current);
        autoEndCallTimerRef.current = null;
      }

    } catch (err) {

      console.error("Failed to accept call:", err);
      rejectCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, createPeerConnection]);

  const rejectCall = useCallback(() => {
    if (socket && incomingCallRef.current) {
      const {
        from,
        chatId,
        type,
      } = incomingCallRef.current;

      socket.emit("call:end", {
        to: from,
        from: user._id,
        chatId,
        callType: type,
        callDuration: 0,
        wasAnswered: false,
        endedBy: user._id,
      });
    }

    cleanup();
  }, [socket, user, cleanup]);

  const endCall = useCallback(() => {
    if (socket && remoteUser) {
      socket.emit("call:end", {
        to: remoteUser._id,
        chatId: activeChatId,
        from: user._id,
        callType,
        callDuration,
        wasAnswered: callStatus === "connected",
        endedBy: user._id,
      });
    }

    cleanup();
  }, [
    socket,
    remoteUser,
    activeChatId,
    user,
    callType,
    callDuration,
    callStatus,
    cleanup,
  ]);

  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((prev) => !prev);
  }, []);

  // ---- Global socket listeners for incoming call events ----
  useEffect(() => {
    if (!socket) return;

    const handleInvite = ({
      from,
      fromName,
      fromPic,
      offer,
      callType: type,
      chatId,
    }) => {
      if (callStatus !== "idle") {
        socket.emit("call:reject", {
          to: from,
          chatId,
          callType: type || "audio",
        });
        return;
      }

      incomingCallRef.current = {
        from,
        offer,
        type: type || "audio",
        chatId,
      };

      setRemoteUser({
        _id: from,
        name: fromName,
        profilePic: fromPic,
      });

      setActiveChatId(chatId);
      setCallType(type || "audio");
      setCallStatus("incoming");

      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current = null;
      }

      const ringtone = new Audio("/ringtone.mp3");
      ringtone.loop = true;
      ringtone.play().catch((err) => {
        console.log("Ringtone play blocked:", err);
      });

      ringtoneRef.current = ringtone;

      // Auto reject incoming call after 30 seconds
      if (autoEndCallTimerRef.current) {
        clearTimeout(autoEndCallTimerRef.current);
      }

      autoEndCallTimerRef.current = setTimeout(() => {
        socket.emit("call:end", {
          to: from,
          from: user._id,
          chatId,
          callType: type || "audio",
          callDuration: 0,
          wasAnswered: false,

          reason: "missed",
          endedBy: user._id,
        });

        cleanup();
      }, 30000);
    };



    const handleAccept = async ({ answer }) => {
      if (!pcRef.current) return;

      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      for (const candidate of pendingCandidatesRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      // Call answered — cancel outgoing ringing timeout
      if (autoEndCallTimerRef.current) {
        clearTimeout(autoEndCallTimerRef.current);
        autoEndCallTimerRef.current = null;
      }
      setCallStatus("connected");
      startDurationTimer();

    };

    const handleReject = () => {
      cleanup();
    };

    const handleEnd = () => {
      cleanup();
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    socket.on("call:invite", handleInvite);
    socket.on("call:accept", handleAccept);
    socket.on("call:reject", handleReject);
    socket.on("call:end", handleEnd);
    socket.on("call:ice-candidate", handleIceCandidate);

    return () => {
      socket.off("call:invite", handleInvite);
      socket.off("call:accept", handleAccept);
      socket.off("call:reject", handleReject);
      socket.off("call:end", handleEnd);
      socket.off("call:ice-candidate", handleIceCandidate);
    };
  }, [socket, callStatus, cleanup]);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        remoteUser,
        activeChatId,
        callDuration,
        isMuted,
        isCameraOff,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
      {/* Plays remote audio for audio-only calls (video calls play audio
          through the <video> element in CallOverlay instead) */}
      <audio ref={remoteAudioRef} autoPlay />
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
