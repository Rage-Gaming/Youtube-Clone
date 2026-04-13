import mongoose from "mongoose";
const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
    usercommentedImage: { type: String },
    usersLikes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "user",
      default: []
    },
    usersDislikes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "user",
      default: []
    },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    userCity: { type: String, default: "Unknown" },
    commentedon: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);