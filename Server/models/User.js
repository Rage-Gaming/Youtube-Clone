// backend/models/user.js
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

        // --- MONETIZATION & DOWNLOAD FIELDS ---
        plan: {
            type: String,
            enum: ['Free Plan', 'Bronze Plan', 'Silver Plan', 'Gold Plan'],
            default: 'Free Plan'
        },
        lastDownloadDate: {
            type: String, // Will store as "YYYY-MM-DD"
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