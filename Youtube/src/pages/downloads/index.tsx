import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import Videocard from '@/components/Videocard';
import { Download } from 'lucide-react';

export default function DownloadsPage() {
  const { user } = useUser();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await axiosInstance.get(`/video/downloads/${user._id}`);
        setVideos(res.data);
      } catch (error) {
        console.error("Error fetching downloads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [user]);

  if (loading) return <div className="flex-1 min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  if (!user) return <div className="flex-1 min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center"><p>Please sign in to view your downloads.</p></div>;

  return (
    <div className="flex-1 min-h-screen bg-background text-foreground p-6 overflow-y-auto">
      <Head>
        <title>My Downloads - YouTube Clone</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
          <Download className="text-primary" size={28} />
          <h1 className="text-2xl font-bold tracking-tight">My Downloads</h1>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-xl font-semibold mb-2">No downloads yet</p>
            <p>Videos you download will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video: any) => (
              <Videocard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}