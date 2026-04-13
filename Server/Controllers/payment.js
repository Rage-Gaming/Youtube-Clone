import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "YOUR_TEST_KEY",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_TEST_SECRET",
});

export const createOrder = async (req, res) => {
    try {
        const options = { amount: req.body.plan === 'Bronze Plan' ? 1000 : 5000, currency: "INR" };
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: "Order creation failed" });
    }
};

export const verifyPayment = async (req, res) => {
    // Add signature verification logic here, then update user:
    await User.findByIdAndUpdate(req.body.userId, { plan: req.body.plan });
    res.status(200).json({ message: "Success" });
};