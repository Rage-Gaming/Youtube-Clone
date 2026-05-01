// Youtube/src/components/VideoInfo.tsx
import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import DownloadButton from './DownloadButton'; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from '@/lib/axiosinstance';
import { useUser } from '@/lib/AuthContext';
import { toast } from 'sonner';

export default function VideoInfo({ video }: any) {
  const { user } = useUser();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (video) {
      setLikes(video.Like || 0);
    }
  }, [video]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like videos");
      return;
    }
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, { userId: user._id });
      if (res.data.liked) {
        setIsLiked(true);
        setLikes(prev => prev + 1);
        toast.success("Added to Liked Videos");
      } else {
        setIsLiked(false);
        setLikes(prev => prev - 1);
        toast.success("Removed from Liked Videos");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to like video");
    }
  };

  const handleDislike = () => {
    if (!user) {
      toast.error("Please login to dislike videos");
      return;
    }
    toast("Video dislike registered locally");
  };

  return (
    <div className="mt-4">
      <h1 className="text-xl font-bold">{video?.videotitle || video?.title}</h1>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 gap-4">
        
        {/* Channel Info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            {video?.uploaderImage && <AvatarImage src={video.uploaderImage} />}
            <AvatarFallback>{video?.videochanel ? video.videochanel[0].toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{video?.videochanel || video?.uploaderName || "Unknown Creator"}</h3>
            <p className="text-xs text-muted-foreground">{video?.views || 0} views</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center bg-secondary rounded-full overflow-hidden">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${isLiked ? 'text-primary' : ''}`}
            >
              <ThumbsUp size={18} className={isLiked ? 'fill-primary' : ''} /> {likes > 0 ? likes.toLocaleString() : 'Like'}
            </button>
            <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-700"></div>
            <button 
              onClick={handleDislike}
              className="px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <ThumbsDown size={18} />
            </button>
          </div>

          <button className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-full hover:bg-secondary/80 transition-colors">
            <Share2 size={18} /> Share
          </button>

          <DownloadButton 
            videoUrl={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`} 
            videoTitle={video?.videotitle || video?.title || 'video'} 
            videoId={video?._id} 
          />

        </div>
      </div>
      
      <div className="bg-secondary/50 rounded-xl p-4 mt-4 text-sm">
        <p>{video?.description}</p>
      </div>
    </div>
  );
}