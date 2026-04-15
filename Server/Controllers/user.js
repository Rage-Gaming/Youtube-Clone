import User from '../models/Auth.js';

export const login = async (req, res) => {
    try {
        const { email, name, image } = req.body;

        let existingUser = await User.findOne({ email });

        if (!existingUser) {
            const newUser = new User({
                email,
                name,
                image,
                plan: "Free Plan",
                dailyDownloads: 0
            });
            existingUser = await newUser.save();
        }

        res.status(200).json({
            success: true,
            result: existingUser
        });

    } catch (error) {
        console.error("Login sync error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};