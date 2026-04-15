import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },

  plan: {
    type: String,
    enum: ['Free Plan', 'Bronze Plan', 'Silver Plan', 'Gold Plan'],
    default: 'Free Plan'
  },
  lastDownloadDate: {
    type: String,
    default: ""
  },
  dailyDownloads: {
    type: Number,
    default: 0
  },
  downloadedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "videofiles"
  }]
}, { timestamps: true });

export default mongoose.models.user || mongoose.model("user", userschema);