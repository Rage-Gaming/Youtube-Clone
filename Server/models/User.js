import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        image: {
            type: String
        },

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
        }
    },
    { timestamps: true }
);

export default mongoose.model("user", userSchema);