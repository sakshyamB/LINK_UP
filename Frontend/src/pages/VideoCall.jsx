import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../api";

const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const VideoCall = () => {
  const { userId } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { socket } = useSocket() || {};
  const navigate = useNavigate();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const makingOffer = useRef(false);
  const roomIdRef = useRef(params.get("room") || `${[user?.id, userId].sort().join("-")}`);
  const [status, setStatus] = useState("Connecting camera...");
  const [other, setOther] = useState(null);

  useEffect(() => {
    api(`/users/${userId}`)
      .then((data) => setOther(data.user))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!socket || !user) return;
    let stopped = false;

    const createPeer = (stream) => {
      const pc = new RTCPeerConnection(iceServers);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (event) => {
        if (remoteRef.current) remoteRef.current.srcObject = event.streams[0];
        setStatus("In call");
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:signal", {
            roomId: roomIdRef.current,
            data: { type: "ice", candidate: event.candidate },
          });
        }
      };
      return pc;
    };

    const sendOffer = async () => {
      const pc = pcRef.current;
      if (!pc || makingOffer.current) return;
      makingOffer.current = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call:signal", {
        roomId: roomIdRef.current,
        data: { type: "offer", sdp: offer },
      });
      setStatus("Calling...");
    };

    const cleanupMedia = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
    };

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;
      createPeer(stream);
      socket.emit("call:join", roomIdRef.current);
      const isCaller = !params.get("room");
      if (isCaller) {
        socket.emit("call:invite", { toUserId: userId, roomId: roomIdRef.current });
        setStatus("Waiting for the other person...");
      } else {
        setStatus("Joining...");
      }
    };

    const onPeerReady = async () => {
      if (!params.get("room")) await sendOffer();
    };

    const onSignal = async ({ data }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (data.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:signal", {
          roomId: roomIdRef.current,
          data: { type: "answer", sdp: answer },
        });
      } else if (data.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.type === "ice" && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          /* ignore */
        }
      }
    };

    socket.on("call:peer-ready", onPeerReady);
    socket.on("call:signal", onSignal);
    socket.on("call:ended", () => {
      setStatus("Call ended");
      cleanupMedia();
    });
    start().catch(() => setStatus("Camera/microphone permission is required."));

    return () => {
      stopped = true;
      socket.off("call:peer-ready", onPeerReady);
      socket.off("call:signal", onSignal);
      socket.off("call:ended");
      cleanupMedia();
    };
  }, [socket, user, userId]);

  const hangup = () => {
    socket?.emit("call:end", { roomId: roomIdRef.current, toUserId: userId });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <p>
          {status} {other ? `· ${other.username}` : ""}
        </p>
        <button onClick={hangup} className="bg-red-600 px-4 py-2 rounded-full">
          End call
        </button>
      </div>
      <div className="flex-1 grid md:grid-cols-2 gap-3 p-4">
        <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl bg-gray-800" />
        <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl bg-gray-800" />
      </div>
    </div>
  );
};

export default VideoCall;
