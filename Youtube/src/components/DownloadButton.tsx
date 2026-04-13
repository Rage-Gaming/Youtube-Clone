import { useState } from 'react';
import { Download } from 'lucide-react';
import axiosInstance from '@/lib/axiosinstance';
import { useUser } from '@/lib/AuthContext';
import { toast } from 'sonner';
import UpgradeModal from './UpgradeModal'; //

export default function DownloadButton({ videoUrl, videoTitle }:any) {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClick = async () => {
    if (!user) return toast.error("Please log in to download videos.");
    setIsDownloading(true);

    try {
      // 1. Check daily limit on backend
      const res = await axiosInstance.post('/video/check-download', { userId: user._id });
      
      if (res.data.allowed) {
        toast.success("Download started!");
        
        // 2. Browser file download logic
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${videoTitle}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        // 3. Limit reached -> Open Razorpay Pricing!
        setIsModalOpen(true); 
      } else {
        toast.error("Something went wrong checking download eligibility.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleDownloadClick}
        disabled={isDownloading}
        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/80 transition-colors"
      >
        <Download size={18} />
        {isDownloading ? 'Checking...' : 'Download'}
      </button>

      <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}