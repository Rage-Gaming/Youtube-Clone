import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp, MapPin, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ml", name: "Malayalam" },
  { code: "ta", name: "Tamil" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
];

export interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  usercommentedImage: string;
  userCity?: string;
  commentedon: string;
  likes: number;
  dislikes: number;
  usersLikes: string[];
  usersDislikes?: string[];
}

interface CommentItemProps {
  comment: Comment;
  user: any;
  onDelete: (id: string) => void;
}

const CommentItem = ({ comment, user, onDelete }: CommentItemProps) => {
  const [likes, setLikes] = useState(comment?.likes || 0);
  const [dislikes, setDislikes] = useState(comment?.dislikes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const [targetLang, setTargetLang] = useState("en");

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.commentbody || "");

  useEffect(() => {
    if (user && comment) {
      if (comment.usersLikes?.includes(user._id)) setIsLiked(true);
      if (comment.usersDislikes?.includes(user._id)) setIsDisliked(true);
    }
  }, [comment, user]);

  if (!comment) return null;

  const handleTranslate = async () => {
    if (isTranslated) { setIsTranslated(false); return; }

    setIsTranslating(true);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURI(comment.commentbody)}`;

      const res = await fetch(url);
      const data = await res.json();

      const result = data[0].map((item: any) => item[0]).join("");

      setTranslatedText(result);
      setIsTranslated(true);
    } catch (error) {
      console.error(error);
      toast.error("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLike = async () => {
    if (!user) return toast.error("Login required");
    try {
      const res = await axiosInstance.post(`/comment/likecomment/${comment._id}`, { userId: user._id });
      if (res.data.liked) {
        setIsLiked(true);
        setLikes(prev => prev + 1);
        if (isDisliked) { setIsDisliked(false); setDislikes(prev => prev - 1); }
      } else {
        setIsLiked(false);
        setLikes(prev => prev - 1);
      }
    } catch (error) { console.error(error); }
  };

  const handleDislike = async () => {
    if (!user) return toast.error("Login required");
    try {
      const res = await axiosInstance.post(`/comment/dislikecomment/${comment._id}`, { userId: user._id });
      if (res.data.commentDeleted) {
        toast.error("Comment removed due to dislikes");
        onDelete(comment._id);
        return;
      }
      if (res.data.disliked) {
        setIsDisliked(true);
        setDislikes(prev => prev + 1);
        if (isLiked) { setIsLiked(false); setLikes(prev => prev - 1); }
      } else {
        setIsDisliked(false);
        setDislikes(prev => prev - 1);
      }
    } catch (error) { console.error(error); }
  };

  const handleUpdate = async () => {
    if (!editText.trim()) return;

    const allowedPattern = /^[a-zA-Z0-9\s.,!?'"-]*$/;

    if (!allowedPattern.test(editText)) {
      toast.error("Special characters are not allowed");
      return;
    }
    
    try {
      await axiosInstance.post(`/comment/editcomment/${comment._id}`, { commentbody: editText });
      setIsEditing(false);
      toast.success("Updated");
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message);
      } else {
        console.log(error);
        toast.error("Update failed");
      }
    }
  };

  return (
    <div className="flex gap-4 mb-6">
      <Avatar className="w-10 h-10 border border-gray-100 shrink-0">
        <AvatarImage src={comment.usercommentedImage} />
        <AvatarFallback>{comment.usercommented?.[0] || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-900">{comment.usercommented}</span>

          {comment.userCity && (
            <div className="flex items-center text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              <MapPin className="w-3 h-3 mr-1" />
              {comment.userCity}
            </div>
          )}

          <span className="text-xs text-gray-500">
            {comment.commentedon ? formatDistanceToNow(new Date(comment.commentedon)) : "Just now"} ago
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button size="sm" onClick={handleUpdate}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2 break-words">
              {isTranslated ? translatedText : comment.commentbody}
            </p>

            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
              <Button variant="ghost" size="sm" className="rounded-full px-3 h-8 hover:bg-gray-100" onClick={handleLike}>
                <ThumbsUp className={`w-4 h-4 mr-1.5 ${isLiked ? "fill-black text-black" : ""}`} />
                {likes > 0 && likes.toLocaleString()}
              </Button>

              <Button variant="ghost" size="sm" className="rounded-full px-3 h-8 hover:bg-gray-100" onClick={handleDislike}>
                <ThumbsDown className={`w-4 h-4 mr-1.5 ${isDisliked ? "fill-black text-black" : ""}`} />
                {dislikes > 0 && dislikes.toLocaleString()}
              </Button>

              <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 ml-2 h-8">

                {!isTranslated && (
                  <div className="flex items-center">
                    <span className="text-[9px] text-gray-400 pl-2">To:</span>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="bg-transparent text-[11px] text-gray-600 font-medium h-full pl-1 pr-2 outline-none cursor-pointer hover:text-black appearance-none"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="h-full px-3 text-xs hover:bg-white hover:text-indigo-600 rounded-r-full border-l border-gray-200"
                >
                  {isTranslating ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : isTranslated ? (
                    "Original"
                  ) : (
                    "Translate"
                  )}
                </Button>
              </div>

              {comment.userid === user?._id && (
                <div className="ml-auto flex gap-1">
                  <button onClick={() => setIsEditing(true)} className="hover:bg-gray-100 p-1.5 rounded text-xs text-gray-600">Edit</button>
                  <button onClick={() => onDelete(comment._id)} className="hover:bg-red-50 p-1.5 rounded text-xs text-red-600">Delete</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommentItem;