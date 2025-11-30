import React, { useEffect, useRef } from 'react'

const VideoPlayer = ({ video }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div className='aspect-video bg-black rounded-lg overflow-hidden'>
      <video ref={videoRef} className='w-full h-full' controls autoPlay>
        <source src={`${process.env.BACKEND_URL}/${video?.filepath}`} type="video/mp4" />
        Your browser does not support the video player.
      </video>
    </div>
  )
}

export default VideoPlayer