// backend/Controllers/user.js
import User from "../models/User.js";

export const login = async (req, res) => {
    try {
        const { email, name, image } = req.body;

        // 1. Check if the user already exists in MongoDB
        let existingUser = await User.findOne({ email });

        // 2. If they don't exist, this is a new user! Create them in MongoDB.
        if (!existingUser) {
            const newUser = new User({
                email,
                name,
                image,
                plan: "Free Plan", // Default plan for everyone
                dailyDownloads: 0
            });
            existingUser = await newUser.save();
        }

        // 3. Send the user data back exactly how AuthContext.tsx expects it
        res.status(200).json({
            success: true,
            result: existingUser
        });

    } catch (error) {
        console.error("Login sync error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};