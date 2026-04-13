import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import io, { Socket } from 'socket.io-client';
import { MonitorUp, Video, VideoOff, Mic, MicOff, CircleDot, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

const SOCKET_URL = "http://localhost:5000"; 

export default function VideoCallRoom() {
  const router = useRouter();
  const { id: roomId } = router.query;

  // Next.js SSR Fix: Only render heavy browser APIs after hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!mounted || !roomId) return;

    socketRef.current = io(SOCKET_URL);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = currentStream;
        }

        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
        });
        peerConnectionRef.current = peerConnection;

        currentStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, currentStream);
        });

        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit("ice-candidate", {
              target: roomId, 
              candidate: event.candidate
            });
          }
        };

        if (socketRef.current) {
          socketRef.current.emit("join-room", roomId);

          socketRef.current.on("user-connected", async (userId: string) => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socketRef.current?.emit("offer", { target: userId, caller: socketRef.current.id, sdp: offer });
          });

          socketRef.current.on("offer", async (payload: any) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socketRef.current?.emit("answer", { target: payload.caller, sdp: answer });
          });

          socketRef.current.on("answer", async (payload: any) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          });

          socketRef.current.on("ice-candidate", async (candidate: any) => {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding received ice candidate", e);
            }
          });
        }
      })
      .catch(err => {
        console.error("Camera access denied or unavailable", err);
        toast.error("Please allow camera/microphone access to join the room.");
      });

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      socketRef.current?.disconnect();
      peerConnectionRef.current?.close();
    };
  }, [roomId, mounted]);

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === videoTrack.kind);
        sender?.replaceTrack(videoTrack);
        
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        videoTrack.onended = () => {
          const cameraTrack = stream?.getVideoTracks()[0];
          if (cameraTrack) sender?.replaceTrack(cameraTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          setIsScreenSharing(false);
        };
      } catch (err) {
        toast.error("Screen sharing cancelled.");
      }
    } else {
      const cameraTrack = stream?.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
      if (cameraTrack) sender?.replaceTrack(cameraTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsScreenSharing(false);
    }
  };

  const toggleRecording = () => {
    if (!isRecording && stream) {
      recordedChunks.current = [];
      const options = { mimeType: 'video/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `Session_Record_${new Date().getTime()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Recording saved to your device!");
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Recording started.");
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const toggleMute = () => {
    if (stream && stream.getAudioTracks()[0]) {
      const newMutedState = !isMuted;
      stream.getAudioTracks()[0].enabled = !newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const toggleVideo = () => {
    if (stream && stream.getVideoTracks()[0]) {
      const newVideoState = !isVideoOff;
      stream.getVideoTracks()[0].enabled = !newVideoState;
      setIsVideoOff(newVideoState);
    }
  };

  const endCall = () => {
    stream?.getTracks().forEach(track => track.stop());
    router.push('/');
  };

  if (!mounted) return <div className="min-h-screen w-full bg-background flex items-center justify-center text-foreground">Loading Room...</div>;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col p-4 md:p-8 transition-colors duration-300">
      
      {/* Header Info */}
      <div className="w-full max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Live Session Room</h1>
        <div className="text-sm px-3 py-1 bg-secondary text-secondary-foreground rounded-full font-medium shadow-sm">
          ID: {roomId}
        </div>
      </div>

      {/* Video Grid using semantic variables */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 relative max-w-6xl mx-auto w-full">
        
        {/* Local Video */}
        <div className="relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex items-center justify-center min-h-[300px]">
          {isVideoOff ? (
            <div className="flex flex-col items-center text-muted-foreground">
              <VideoOff size={48} className="mb-4 opacity-50" />
              <p>Camera is disabled</p>
            </div>
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform scale-x-[-1]'}`} />
          )}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
            You {isScreenSharing && "(Sharing Screen)"}
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex items-center justify-center min-h-[300px]">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
            Remote User
          </div>
        </div>

      </div>

      {/* Toolbar using shadcn-like button styling */}
      <div className="max-w-max mx-auto flex items-center justify-center gap-3 mt-8 bg-card border border-border p-3 rounded-full shadow-lg">
        <button 
          onClick={toggleMute} 
          className={`p-4 rounded-full transition-all ${isMuted ? 'bg-destructive text-destructive-foreground shadow-md hover:opacity-90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        
        <button 
          onClick={toggleVideo} 
          className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-destructive text-destructive-foreground shadow-md hover:opacity-90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>

        <button 
          onClick={toggleScreenShare} 
          className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          <MonitorUp size={22} />
        </button>

        <button 
          onClick={toggleRecording} 
          className={`p-4 rounded-full transition-all flex items-center gap-2 ${isRecording ? 'bg-destructive text-destructive-foreground animate-pulse shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          <CircleDot size={22} /> {isRecording && <span className="font-semibold pr-1">REC</span>}
        </button>

        <div className="w-[1px] h-8 bg-border mx-2"></div>

        <button 
          onClick={endCall} 
          className="p-4 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity shadow-md"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}