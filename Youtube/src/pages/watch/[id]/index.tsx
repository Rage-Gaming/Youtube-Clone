import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import VideoPlayer from "@/components/VideoPlayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const Index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [videos, setVideos] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true);
  
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return; 

      try {
        const res = await axiosInstance.get("/video/getall");
        const currentVideo = res.data?.find((vid: any) => vid._id === id);
        
        setVideos(currentVideo);
        setAllVideos(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideo();
  }, [id]);

  const handleNextVideo = () => {
    if (!videos || !allVideos.length) return;

    const currentIndex = allVideos.findIndex((v) => v._id === videos._id);
    
    const nextIndex = (currentIndex + 1) % allVideos.length;
    const nextVideo = allVideos[nextIndex];

    if (nextVideo) {
      router.push(`/video/${nextVideo._id}`);
    }
  };

  const handleShowComments = () => {
    if (commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!videos) return <div>Video not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            <VideoPlayer 
              video={videos} 
              onNextVideo={handleNextVideo}
              onShowComments={handleShowComments}
            />
            
            <VideoInfo video={videos} />
            
            <div ref={commentsRef}>
              <Comments videoId={id} />
            </div>

          </div>
          <div className="space-y-4">
            <RelatedVideos videos={allVideos} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;