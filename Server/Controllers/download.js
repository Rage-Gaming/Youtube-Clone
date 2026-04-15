// Server/Controllers/download.js
import User from '../models/Auth.js';
import Video from '../models/Video.js'; // Ensure you have your video model imported

// 1. Check Limits AND Record the Download
export const recordAndCheckDownload = async (req, res) => {
    try {
        const { userId, videoId } = req.body;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if they already downloaded this specific video before (optional nice feature)
        const alreadyDownloaded = user.downloadedVideos.includes(videoId);
        const today = new Date().toISOString().split('T')[0];
        let isAllowed = false;

        // Premium bypass
        if (user.plan !== 'Free Plan') {
            isAllowed = true;
        } else {
            // Free limit logic
            if (user.lastDownloadDate === today) {
                if (user.dailyDownloads < 1 || alreadyDownloaded) {
                    isAllowed = true;
                    if (!alreadyDownloaded) user.dailyDownloads += 1;
                }
            } else {
                user.lastDownloadDate = today;
                user.dailyDownloads = 1;
                isAllowed = true;
            }
        }

        if (!isAllowed) {
            return res.status(403).json({ allowed: false, message: "Limit reached. Upgrade to Premium." });
        }

        // ⭐ NEW: Save the video to their profile if they haven't already
        if (!alreadyDownloaded && videoId) {
            user.downloadedVideos.push(videoId);
            await user.save();
        }

        return res.status(200).json({ allowed: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Fetch the user's downloaded videos for their profile
export const getDownloadedVideos = async (req, res) => {
    try {
        const { userId } = req.params;
        // .populate() automatically fetches the full video details using the IDs!
        const user = await User.findById(userId).populate('downloadedVideos');

        if (!user) return res.status(404).json({ message: "User not found" });

        // Reverse it so the newest downloads are at the top
        res.status(200).json(user.downloadedVideos.reverse());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};