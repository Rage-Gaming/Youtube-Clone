import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useUser } from '@/lib/AuthContext';
import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';
import { Phone, PhoneOff, MonitorUp, Video, Mic, MicOff, VideoOff, Disc3, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function CallPage() {
  const { user } = useUser();
  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<any>(null);

  useEffect(() => {
    // Initialize PeerJS
    if (typeof window !== 'undefined') {
      const peer = new Peer();
      
      peer.on('open', (id) => {
        setPeerId(id);
      });

      peer.on('call', (call) => {
        // Automatically answer incoming calls if we have a stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setMyStream(stream);
            if (myVideoRef.current) myVideoRef.current.srcObject = stream;
            
            call.answer(stream); // Answer the call with an A/V stream.
            
            call.on('stream', (remoteStream) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });
            callRef.current = call;
            setIsCalling(true);
            toast.success("Incoming call connected.");
          })
          .catch(err => {
            toast.error("Failed to get local stream for incoming call.");
          });
      });

      peerRef.current = peer;
    }

    return () => {
      peerRef.current?.destroy();
      if (myVideoRef.current?.srcObject) {
        (myVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      toast.error("Could not access camera/microphone");
      return null;
    }
  };

  const callPeer = async (id: string) => {
    const stream = await startLocalStream();
    if (!stream || !peerRef.current) return;

    const call = peerRef.current.call(id, stream);
    
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });

    callRef.current = call;
    setIsCalling(true);
  };

  const endCall = () => {
    callRef.current?.close();
    if (myVideoRef.current?.srcObject) {
      (myVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      myVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      (remoteVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    setMyStream(null);
    setIsCalling(false);
    setIsScreenSharing(false);
    toast.info("Call ended");
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        // Replace video track in current peer connection
        if (callRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = callRef.current.peerConnection.getSenders().find((s: any) => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        if (myVideoRef.current) myVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        // When screen sharing stops via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    try {
      // Stop the screen share tracks first
      if (myVideoRef.current && myVideoRef.current.srcObject) {
         const screenStream = myVideoRef.current.srcObject as MediaStream;
         screenStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (callRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = callRef.current.peerConnection.getSenders().find((s: any) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      setIsScreenSharing(false);
      setIsVideoMuted(false);
      setIsAudioMuted(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAudio = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    if (isVideoMuted) {
      // Turn camera BACK ON
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        if (myStream) {
          myStream.addTrack(newVideoTrack);
          if (callRef.current) {
            const sender = callRef.current.peerConnection.getSenders().find((s: any) => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(newVideoTrack);
            }
          }
        } else {
           setMyStream(newStream);
           if (myVideoRef.current) myVideoRef.current.srcObject = newStream;
        }
        setIsVideoMuted(false);
      } catch (err) {
        toast.error("Could not turn camera back on.");
      }
    } else {
      // Turn camera OFF completely to disable hardware light
      if (myStream) {
        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          myStream.removeTrack(videoTrack);
          
          // Optionally send a black frame or just let the peer connection handle the stopped track
          if (callRef.current) {
             const sender = callRef.current.peerConnection.getSenders().find((s: any) => s.track && s.track.kind === 'video');
             // Keeping the sender active but replacing track with null isn't universally supported seamlessly without renegotiation in all browsers via PeerJS, 
             // but track.stop() alone usually freezes the last frame or sends black on the remote end natively.
          }
        }
      }
      setIsVideoMuted(true);
    }
  };

  // --- Recording Logic ---
  const handleStartRecording = () => {
    if (!myStream && !remoteVideoRef.current?.srcObject) {
      toast.error("Nothing to record!");
      return;
    }

    const chunks: Blob[] = [];
    setRecordedChunks([]);

    // Combine local and remote streams if both exist, otherwise just use what's available
    // For simplicity, let's record the local screen/video primarily, or remote if you prefer.
    // Here we record the local stream (which includes screen share if active).
    const streamToRecord = myStream; 
    
    if (!streamToRecord) return;

    const mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      setRecordedChunks(chunks);
      toast.success("Recording saved. You can now download it.");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    toast.success("Recording started");
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDownloadRecording = () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `YouTube-Call-Record-${new Date().getTime()}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return <div className="flex-1 min-h-screen flex items-center justify-center p-8">Please login to use VoIP.</div>;
  }

  return (
    <div className="flex-1 min-h-screen bg-[#0f0f0f] text-white p-6 flex flex-col">
      <Head>
        <title>Video Call - YouTube Clone</title>
      </Head>

      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">VoIP & Screen Share</h1>
        
        <div className="bg-[#1f1f1f] p-6 rounded-2xl mb-8 border border-gray-800">
          <p className="text-gray-400 mb-2">Your Peer ID. Share this with a friend:</p>
          <div className="flex items-center gap-4 bg-black p-3 rounded-xl mb-6 font-mono text-green-400">
            {peerId || 'Generating...'}
          </div>

          {!isCalling && (
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Enter Friend's Peer ID" 
                value={remotePeerIdValue}
                onChange={(e) => setRemotePeerIdValue(e.target.value)}
                className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition"
              />
              <button 
                onClick={() => callPeer(remotePeerIdValue)}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl flex items-center gap-2 font-semibold"
              >
                <Phone size={18} /> Call
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          {/* Local Video */}
          <div className="bg-black rounded-2xl overflow-hidden aspect-video relative border border-gray-800 flex items-center justify-center">
            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-sm">You</div>
          </div>

          {/* Remote Video */}
          <div className="bg-black rounded-2xl overflow-hidden aspect-video relative border border-gray-800 flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!isCalling && <div className="text-gray-600">Waiting for connection...</div>}
            {isCalling && <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-sm">Friend</div>}
          </div>

        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={toggleAudio}
            className={`p-4 rounded-full transition ${isAudioMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`p-4 rounded-full transition ${isVideoMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button 
            onClick={toggleScreenShare}
            className={`px-6 py-4 rounded-full transition flex items-center gap-2 font-semibold ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            <MonitorUp size={20} />
            {isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          </button>

          {!isRecording ? (
             <button 
             onClick={handleStartRecording}
             disabled={!myStream && !isCalling}
             className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center gap-2 font-semibold disabled:opacity-50"
           >
             <Disc3 size={20} />
             Record Call
           </button>
          ) : (
            <button 
              onClick={handleStopRecording}
              className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center gap-2 font-semibold animate-pulse"
            >
              <Disc3 size={20} />
              Stop Recording
            </button>
          )}

          {isCalling && (
            <button 
              onClick={endCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
            >
              <PhoneOff size={24} />
            </button>
          )}
        </div>
        
        {recordedChunks.length > 0 && !isRecording && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={handleDownloadRecording}
              className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 transition flex items-center gap-2 font-semibold"
            >
              <Download size={20} />
              Save Recording Locally
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
