import React from 'react';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import DownloadButton from './DownloadButton';

export default function VideoInfo({ video }:any) {
  return (
    <div className="mt-4">
      <h1 className="text-xl font-bold">{video?.title}</h1>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 gap-4">
        
        {/* Channel Info Section */}
        <div className="flex items-center gap-3">
          <img src={video?.uploaderImage} className="w-10 h-10 rounded-full" />
          <div>
            <h3 className="font-semibold">{video?.uploaderName}</h3>
            <p className="text-xs text-muted-foreground">{video?.views} views</p>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center bg-secondary rounded-full overflow-hidden">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10">
              <ThumbsUp size={18} /> Like
            </button>
            <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-700"></div>
            <button className="px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10">
              <ThumbsDown size={18} />
            </button>
          </div>

          <button className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-full hover:bg-secondary/80">
            <Share2 size={18} /> Share
          </button>

          {/* 👈 2. Drop your Smart Download Button right here! */}
          <DownloadButton 
            videoUrl={video?.videoUrl} 
            videoTitle={video?.title || 'video'} 
          />

        </div>
      </div>
      
      {/* Video Description */}
      <div className="bg-secondary/50 rounded-xl p-4 mt-4 text-sm">
        <p>{video?.description}</p>
      </div>
    </div>
  );
}