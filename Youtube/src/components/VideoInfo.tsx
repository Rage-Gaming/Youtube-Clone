// Youtube/src/components/VideoInfo.tsx
import React from 'react';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import DownloadButton from './DownloadButton'; 

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function VideoInfo({ video }: any) {
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
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <ThumbsUp size={18} /> Like
            </button>
            <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-700"></div>
            <button className="px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
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