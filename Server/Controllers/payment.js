import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/Auth.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_YourTestKey",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "YourTestSecret",
    });
};

const getAmount = (plan) => {
    switch(plan) {
        case 'Bronze Plan': return 1000; // 10rs * 100 paise
        case 'Silver Plan': return 5000;
        case 'Gold Plan': return 10000;
        default: return 1000;
    }
};

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const options = { amount: getAmount(plan), currency: "INR", receipt: `receipt_${Date.now()}` };
        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error("Order creation failed", error);
        res.status(500).json({ message: "Order creation failed" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, email } = req.body;
        
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "YourTestSecret")
            .update(body.toString())
            .digest("hex");
            
        if (expectedSignature === razorpay_signature) {
            await User.findByIdAndUpdate(userId, { plan: plan });
            
            // Send email
            if (email) {
                try {
                    // Generate test SMTP service account from ethereal.email
                    const testAccount = await nodemailer.createTestAccount();
                    
                    const transporter = nodemailer.createTransport({
                        host: 'smtp.ethereal.email',
                        port: 587,
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: testAccount.user, // generated ethereal user
                            pass: testAccount.pass  // generated ethereal password
                        }
                    });
                    
                    const info = await transporter.sendMail({
                        from: '"Youtube Clone" <noreply@youtubeclone.com>',
                        to: email,
                        subject: "Payment Invoice - Premium Plan Upgrade",
                        text: `Your payment for the ${plan} was successful. \nOrder ID: ${razorpay_order_id}\nPayment ID: ${razorpay_payment_id}\nThank you for upgrading!`,
                    });
                    console.log("Invoice email sent to", email);
                    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                } catch (emailErr) {
                    console.error("Error sending email", emailErr);
                }
            }
            
            res.status(200).json({ message: "Payment verified successfully" });
        } else {
            res.status(400).json({ message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Payment verification failed", error);
        res.status(500).json({ message: "Payment verification failed" });
    }
};