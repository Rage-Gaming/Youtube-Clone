import comment from "../Modals/Comment.js";
import mongoose from "mongoose";

export const postComment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented, usercommentedImage, userCity } = req.body;

  try {
    const allowedPattern = /^[a-zA-Z0-9\s.,!?'"-]*$/;
    if (!allowedPattern.test(commentbody)) {
      return res.status(400).json({ 
        message: "Comment contains invalid special characters." 
      });
    }

    const newComment = new comment({
      videoid,
      userid,
      commentbody,
      usercommented,
      usercommentedImage,
      userCity: userCity || "Unknown Location", 
    });

    const savedComment = await newComment.save();
    res.status(200).json({ comment: savedComment });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editComment = async (req, res) => {
  const { id } = req.params;
  const { commentbody } = req.body;

  try {
    const allowedPattern = /^[a-zA-Z0-9\s.,!?'"-]*$/;
    if (!allowedPattern.test(commentbody)) {
      return res.status(400).json({ 
        message: "Comment contains invalid special characters." 
      });
    }

    const updatedComment = await comment.findByIdAndUpdate(
      id,
      { $set: { commentbody: commentbody } },
      { new: true }
    );

    res.status(200).json(updatedComment);
  } catch (err) {
    res.status(500).json(err);
  }
};


export const likeComment = async (req, res) => {
  const commentId = req.params.id;
  const userId = req.body.userId;

  try {
    const targetComment = await comment.findById(commentId);
    if (!targetComment) return res.status(404).json("Comment not found");

    if (targetComment.usersLikes.includes(userId)) {

      await comment.findByIdAndUpdate(commentId, {
        $pull: { usersLikes: userId },
        $inc: { likes: -1 }
      });

      return res.status(200).json({ liked: false, message: "Like removed" });

    } else {


      const isDisliked = targetComment.usersDislikes.includes(userId);

      let updateQuery = {
        $addToSet: { usersLikes: userId },
        $pull: { usersDislikes: userId },
        $inc: { likes: 1 }
      };

      if (isDisliked) {
        updateQuery.$inc.dislikes = -1;
      }

      await comment.findByIdAndUpdate(commentId, updateQuery);

      return res.status(200).json({ liked: true, message: "Like added" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const dislikeComment = async (req, res) => {
  const commentId = req.params.id;
  const userId = req.body.userId;

  try {
    const targetComment = await comment.findById(commentId);
    if (!targetComment) return res.status(404).json("Comment not found");

    // --- SCENARIO 1: ALREADY DISLIKED (User wants to UN-DISLIKE) ---
    if (targetComment.usersDislikes.includes(userId)) {
      await comment.findByIdAndUpdate(commentId, {
        $pull: { usersDislikes: userId },
        $inc: { dislikes: -1 } // Decrease dislike count
      });
      return res.status(200).json({ disliked: false, message: "Dislike removed" });
    } 
    
    // --- SCENARIO 2: NEW DISLIKE ---
    else {
      // SPECIAL RULE: Check if dislikes reach 2
      // We check current length + 1 (the new dislike coming in)
      if (targetComment.usersDislikes.length + 1 >= 2) {
        
        await comment.findByIdAndDelete(commentId);
        
        // Return a specific flag so frontend knows to remove it from UI
        return res.status(200).json({ 
          commentDeleted: true, 
          message: "Comment deleted due to excessive dislikes" 
        });
      }

      // STANDARD DISLIKE LOGIC (If count < 2)
      // We need to build the query to handle potentially removing a 'Like'
      const isLiked = targetComment.usersLikes.includes(userId);
      
      let updateQuery = {
        $addToSet: { usersDislikes: userId },
        $pull: { usersLikes: userId },
        $inc: { dislikes: 1 }
      };

      // If they previously liked it, we must also decrement the 'likes' counter
      if (isLiked) {
        updateQuery.$inc.likes = -1;
      }

      await comment.findByIdAndUpdate(commentId, updateQuery);
      
      return res.status(200).json({ disliked: true, message: "Dislike added" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};