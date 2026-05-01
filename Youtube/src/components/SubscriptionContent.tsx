import React, { useState } from 'react';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import { toast } from 'sonner';
import { CheckCircle2, Crown, Zap, Shield, Clock } from 'lucide-react';

const PLANS = [
  { 
    name: 'Free Plan', 
    price: 0, 
    limit: '5 Mins / Video',
    features: ['Watch up to 5 minutes', 'Standard Quality', 'Ads Included', '1 Download / Day'] 
  },
  { 
    name: 'Bronze Plan', 
    price: 10, 
    limit: '7 Mins / Video',
    features: ['Watch up to 7 minutes', 'Standard Quality', 'Ad-Free Experience', 'Unlimited Downloads'] 
  },
  { 
    name: 'Silver Plan', 
    price: 50, 
    limit: '10 Mins / Video',
    features: ['Watch up to 10 minutes', 'HD Quality (1080p)', 'Ad-Free Experience', 'Unlimited Downloads'] 
  },
  { 
    name: 'Gold Plan', 
    price: 100, 
    limit: 'Unlimited',
    features: ['Unlimited Watch Time', '4K Ultra HD Quality', 'Priority Support', 'Unlimited Downloads'] 
  },
];

export default function SubscriptionContent() {
  const { user, updateUserPlanLocally } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Dynamic Script Loader for Next.js Razorpay
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planName: string, price: number) => {
    if (!user) return toast.error("Please log in to upgrade your plan.");
    if (price === 0) return toast.info("You are already on the Free Plan.");
    
    setLoadingPlan(planName);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load payment gateway. Check your connection.");
        setLoadingPlan(null);
        return;
      }

      // Create order on backend (Sends ₹10, ₹50, or ₹100)
      const { data: order } = await axiosInstance.post('/payment/create-order', { plan: planName, amount: price });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SIoUfQlQAsPqMO", 
        amount: order.amount,
        currency: order.currency,
        name: "YouTube Clone Premium",
        description: `Upgrade to ${planName}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend. 
            // Note: Your backend should trigger the NodeMailer email invoice inside this route!
            await axiosInstance.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planName,
              userId: user._id,
              email: user.email
            });
            
            updateUserPlanLocally(planName);
            toast.success(`Payment Successful! An invoice has been emailed to you.`);
          } catch (err) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#ef4444" }, // Red theme to match YouTube
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      console.error(error);
      toast.error("Could not initiate payment. Make sure backend is running.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3">
          <Crown className="text-yellow-500" size={40} /> Choose Your Plan
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Unlock extended watch times, ad-free viewing, and ultra-HD quality. 
          Your invoice and confirmation will be emailed instantly upon upgrade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.plan === plan.name || (!user && plan.name === 'Free Plan');
          
          return (
            <div 
              key={plan.name} 
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                isCurrentPlan 
                ? 'border-primary shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-primary/5' 
                : 'border-border bg-card hover:border-primary/50 hover:shadow-xl'
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-md">
                  Current Plan
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black">₹{plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground font-medium">/lifetime</span>}
              </div>

              <div className="bg-secondary/50 text-secondary-foreground rounded-lg p-3 mb-8 flex items-center justify-center gap-2 font-semibold">
                <Clock size={18} className="text-primary" /> {plan.limit}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" /> 
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePayment(plan.name, plan.price)}
                disabled={loadingPlan === plan.name || isCurrentPlan}
                className={`w-full py-3.5 rounded-xl font-bold transition-all ${
                  isCurrentPlan
                  ? 'bg-secondary text-secondary-foreground cursor-not-allowed opacity-50'
                  : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-primary/25'
                }`}
              >
                {loadingPlan === plan.name ? 'Processing...' : isCurrentPlan ? 'Active' : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}