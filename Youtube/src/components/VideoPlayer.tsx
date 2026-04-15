import React, { useRef, useState } from 'react';
import { Play, Pause, FastForward, Rewind, SkipForward, MessageSquare, XCircle } from 'lucide-react';
import { useUser } from '@/lib/AuthContext';
import UpgradeModal from './UpgradeModal'; // Make sure the path matches where you saved the modal

interface VideoPlayerProps {
  video: any;
  onNextVideo: () => void;
  onShowComments: () => void;
}

const VideoPlayer = ({ video, onNextVideo, onShowComments }: VideoPlayerProps) => {
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [feedback, setFeedback] = useState<{ icon: React.ReactNode; text: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const triggerFeedback = (icon: React.ReactNode, text: string) => {
    setFeedback({ icon, text });
    setTimeout(() => setFeedback(null), 800);
  };

  // --- MONETIZATION: Enforce Watch Time Limits ---
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const currentTime = e.currentTarget.currentTime; // in seconds
    const currentPlan = user?.plan || 'Free Plan';
    
    // Limits mapped to seconds
    const limits = {
      'Free Plan': 5 * 60,
      'Bronze Plan': 7 * 60,
      'Silver Plan': 10 * 60,
      'Gold Plan': Infinity
    };

    const maxWatchTime = limits[currentPlan as keyof typeof limits];

    // Pause video and show upgrade modal if limit is reached
    if (currentTime >= maxWatchTime) {
      e.currentTarget.pause();
      setIsPlaying(false);
      setShowUpgradeModal(true);
      
      // Optional: Prevent them from just seeking past it
      if (e.currentTarget.currentTime > maxWatchTime) {
        e.currentTarget.currentTime = maxWatchTime; 
      }
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { width, left } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const percentage = (x / width) * 100;

    let zone: 'left' | 'center' | 'right' = 'center';
    if (percentage < 33) zone = 'left';
    else if (percentage > 66) zone = 'right';

    clickCountRef.current += 1;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      const count = clickCountRef.current;
      clickCountRef.current = 0;

      if (!videoRef.current) return;

      if (count === 1) {
        if (zone === 'center') {
          if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
            triggerFeedback(<Play className="w-10 h-10" />, "Play");
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
            triggerFeedback(<Pause className="w-10 h-10" />, "Pause");
          }
        }
      }

      else if (count === 2) {
        if (zone === 'left') {
          videoRef.current.currentTime -= 10;
          triggerFeedback(<Rewind className="w-10 h-10" />, "-10s");
        } else if (zone === 'right') {
          videoRef.current.currentTime += 10;
          triggerFeedback(<FastForward className="w-10 h-10" />, "+10s");
        }
      }

      else if (count === 3) {
        if (zone === 'left') {
          triggerFeedback(<MessageSquare className="w-10 h-10" />, "Comments");
          onShowComments();
        } else if (zone === 'center') {
          triggerFeedback(<SkipForward className="w-10 h-10" />, "Next Video");
          onNextVideo();
        } else if (zone === 'right') {
          triggerFeedback(<XCircle className="w-10 h-10" />, "Closing...");
          try {
            window.close(); 
            window.location.href = "about:blank"; 
          } catch (e) {
            console.log("Cannot close window via script");
          }
        }
      }
    }, 180);
  };

  return (
    <>
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls 
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate} // <-- Added Time Tracker here
        >
          {/* Ensure NEXT_PUBLIC_ is prefixed if your env variables aren't exposed to the client! */}
          <source src={`${process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`} type="video/mp4" />
          Your browser does not support the video player.
        </video>

        <div 
          className="absolute top-0 left-0 w-full h-[85%] z-10 cursor-pointer"
          onClick={handleTap}
        >
          {feedback && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-white">
                {feedback.icon}
                <span className="text-lg font-bold mt-2">{feedback.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Renders the upgrade prompt when watch limits are hit */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </>
  );
};

export default VideoPlayer;