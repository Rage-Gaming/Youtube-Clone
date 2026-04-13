import comment from "../models/Comment.js";
import mongoose from "mongoose";

export const postComment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented, userCity, originalLanguage } = req.body;

  // ❌ STRICT RULE 1: Do not allow special characters
  // This regex allows letters, numbers, spaces, basic punctuation, and multi-language unicode
  const isValidText = /^[a-zA-Z0-9\s.,!?\u00C0-\u1FFF\u2C00-\uD7FF]+$/.test(commentbody);

  if (!isValidText) {
    return res.status(400).json({ message: "Special characters are not allowed." });
  }

  try {
    const newComment = new comment({
      videoid,
      userid,
      commentbody,
      usercommented,
      userCity: userCity || "Unknown",
      originalLanguage: originalLanguage || "auto"
    });
    await newComment.save();
    res.status(200).json(newComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
  const { id } = req.params; // Comment ID
  const { userid } = req.body;

  try {
    const commentData = await comment.findById(id);
    if (!commentData) return res.status(404).json({ message: "Comment not found" });

    // Add user to dislikes if not already there
    if (!commentData.usersDislikes.includes(userid)) {
      commentData.usersDislikes.push(userid);
      // Remove from likes if they had liked it
      commentData.usersLikes = commentData.usersLikes.filter(uid => uid.toString() !== userid);
    }

    // ❌ STRICT RULE 2: Auto-delete if they receive 2 dislikes
    if (commentData.usersDislikes.length >= 2) {
      await comment.findByIdAndDelete(id);
      return res.status(200).json({ message: "Comment automatically deleted due to negative feedback." });
    }

    // Otherwise, update the counts and save
    commentData.dislikes = commentData.usersDislikes.length;
    commentData.likes = commentData.usersLikes.length;

    await commentData.save();
    res.status(200).json(commentData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};