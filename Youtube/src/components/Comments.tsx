import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import CommentItem, { Comment } from "./CommentItem";

const Comments = ({ videoId }: { videoId: any }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!videoId) return;
    const loadComments = async () => {
      try {
        const res = await axiosInstance.get(`/comment/${videoId}`);
        if (res.data) setComments(res.data);
      } catch (error) {
        console.error("Failed to load comments", error);
      } finally {
        setLoading(false);
      }
    };
    loadComments();
  }, [videoId]);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    const allowedPattern = /^[a-zA-Z0-9\s.,!?'"-]*$/;
    if (!allowedPattern.test(newComment)) {
      toast.error("Special characters are not allowed");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let detectedCity = "Unknown Location";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const ipRes = await fetch("https://ipapi.co/json/", { signal: controller.signal });
        const ipData = await ipRes.json();
        clearTimeout(timeoutId);
        if (ipData.region){
          detectedCity = ipData.region;
        } else if (ipData.city) {
          detectedCity = ipData.city;
        }
      } catch (e) {
        console.warn("Location detection skipped");
      }

      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        usercommentedImage: user.image,
        userCity: detectedCity,
      });

      if (res.data.comment) {
        const newObj: Comment = {
          _id: res.data.comment._id || Date.now().toString(),
          videoid: videoId,
          userid: user._id,
          commentbody: newComment,
          usercommented: user.name || "Anonymous",
          usercommentedImage: user.image || "",
          userCity: detectedCity,
          likes: 0,
          dislikes: 0,
          commentedon: new Date().toISOString(),
          usersLikes: [],
        };
        setComments([newObj, ...comments]);
        setNewComment("");
        toast.success("Comment Posted");
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message);
      } else {
        console.error(error);
        toast.error("Failed to post comment");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment || res.data.commentDeleted) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 max-w-2xl mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{comments.length} Comments</h2>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
      </div>

      {user ? (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10 border shrink-0">
            <AvatarImage src={user.image} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment... (No special chars allowed)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none focus-visible:ring-1"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setNewComment("")}>Cancel</Button>
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting}>
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded text-center">
          Please login to comment.
        </div>
      )}

      <div className="space-y-2">
        {!loading && comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <CommentItem 
              key={comment._id} 
              comment={comment} 
              user={user} 
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;