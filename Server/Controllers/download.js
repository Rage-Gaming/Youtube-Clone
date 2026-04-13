// Server/Controllers/download.js
import User from '../models/User.js';

export const checkDownloadEligibility = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Premium users bypass the limit entirely
        if (user.plan !== 'Free Plan') {
            return res.status(200).json({ allowed: true, message: "Premium download approved." });
        }

        // Free Tier Logic
        const today = new Date().toISOString().split('T')[0]; // Gets "YYYY-MM-DD"

        if (user.lastDownloadDate === today) {
            if (user.dailyDownloads >= 1) {
                return res.status(403).json({
                    allowed: false,
                    message: "Daily download limit reached. Upgrade to Premium for unlimited downloads."
                });
            } else {
                // First download of today
                user.dailyDownloads += 1;
                await user.save();
                return res.status(200).json({ allowed: true, message: "Free download approved." });
            }
        } else {
            // It's a new day! Reset limits.
            user.lastDownloadDate = today;
            user.dailyDownloads = 1;
            await user.save();
            return res.status(200).json({ allowed: true, message: "Free download approved." });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};