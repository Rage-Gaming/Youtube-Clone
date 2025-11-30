import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { useEffect, useState } from 'react'
import { Button } from './ui/button';
import { Clock, Download, MoreHorizontal, Share, ThumbsDown, ThumbsUp } from 'lucide-react';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import { toast } from 'sonner';

const VideoInfo = ({ video }: any) => {
    const [likes, setLikes] = useState(video.Like || 0);
    const [dislikes, setDislikes] = useState(video.Dislike || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isWatchLater, setIsWatchLater] = useState(false);

    const { user } = useUser();

    // const user: any = {
    //     id: 1,
    //     name: 'Nidhin',
    //     email: 'nidhin@example.com',
    //     image: 'https://github.com/Rage-Gaming.png?height=32&width=32'
    // }

    useEffect(() => {
        setLikes(video.Like || 0);
        setDislikes(video.Dislike || 0);
        setIsLiked(false);
        setIsDisliked(false);
    }, [video]);

    useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user]);

    const handleLike = async () => {
        if (!user) {
            toast.error("You need to be logged in to like a video");
        };
        try {
            const res = await axiosInstance.post(`/like/${video._id}`, {
                userId: user?._id,
            });
            if (res.data.liked) {
                if (isLiked) {
                    setLikes((prev: any) => prev - 1);
                    setIsLiked(false);
                } else {
                    setLikes((prev: any) => prev + 1);
                    setIsLiked(true);
                    if (isDisliked) {
                        setDislikes((prev: any) => prev - 1);
                        setIsDisliked(false);
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleDislike = async () => {
        if (!user) return;
        try {
            const res = await axiosInstance.post(`/like/${video._id}`, {
                userId: user?._id,
            });
            if (!res.data.liked) {
                if (isDisliked) {
                    setDislikes((prev: any) => prev - 1);
                    setIsDisliked(false);
                } else {
                    setDislikes((prev: any) => prev + 1);
                    setIsDisliked(true);
                    if (isLiked) {
                        setLikes((prev: any) => prev - 1);
                        setIsLiked(false);
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleWatchLater = async () => {
        try {
            const res = await axiosInstance.post(`/watch/${video._id}`, {
                userId: user?._id,
            });
            if (res.data.watchlater) {
                setIsWatchLater(!isWatchLater);
            } else {
                setIsWatchLater(false);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className='space-y-4'>
            <h1 className='text-xl font-semibold'>{video.title}</h1>

            <div className='flex items-center justify-between'>

                <div className='flex items-center gap-4'>
                    <Avatar className='w-10 h-10'>
                        <AvatarFallback>{video.videochanel[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className='font-medium'>{video.videochanel}</h3>
                        <p className='text-sm text-gray-600'>1.2M subscribers</p>
                    </div>
                    <Button className='ml-4'>Subscribe</Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-full">
                        <Button variant="ghost" size="sm" className="rounded-l-full" onClick={handleLike}>
                            <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? "fill-black text-black" : ""}`} /> {likes.toLocaleString()}
                        </Button>
                        <div className="w-px h-6 bg-gray-300" />
                        <Button variant="ghost" size="sm" className="rounded-r-full" onClick={handleDislike}>
                            <ThumbsDown className={`w-5 h-5 mr-2 ${isDisliked ? "fill-black text-black" : ""}`} /> {dislikes.toLocaleString()}
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" className={`bg-gray-100 rounded-full ${isWatchLater ? "text-primary" : ""}`} onClick={handleWatchLater}>
                        <Clock className="w-5 h-5 mr-2" />{isWatchLater ? "Saved" : "Watch Later"}
                    </Button>
                    <Button variant="ghost" size="sm" className="bg-gray-100 rounded-full"><Share className="w-5 h-5 mr-2" />Share</Button>
                    <Button variant="ghost" size="sm" className="bg-gray-100 rounded-full"><Download className="w-5 h-5 mr-2" />Download</Button>
                    <Button variant="ghost" size="icon" className="bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5" /></Button>
                </div>
            </div>
            <div className='bg-gray-100 rounded-lg p-4'>
                <div className='flex gap-4 text-sm font-medium mb-2'>
                    <span>{video.views.toLocaleString()}</span>
                    <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
                </div>
                <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
                    <p>Sample Video Description. This would contain the actual video description from the database</p>
                </div>
                <Button variant="ghost" size="sm" className='mt-2 p-0 h-auto font-medium' onClick={() => setShowFullDescription(!showFullDescription)}>
                    {showFullDescription ? "Show Less" : "Show More"}
                </Button>
            </div>
        </div>
    )
}

export default VideoInfo