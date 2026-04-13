import { useState } from 'react';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import { toast } from 'sonner';
import { X, CheckCircle } from 'lucide-react';

const PLANS = [
  { name: 'Bronze Plan', price: 10, features: ['Unlimited Downloads', 'Watch up to 7 mins', 'Standard Quality'] },
  { name: 'Silver Plan', price: 50, features: ['Unlimited Downloads', 'Watch up to 10 mins', 'HD Quality'] },
  { name: 'Gold Plan', price: 100, features: ['Unlimited Downloads', 'Unlimited Watch Time', '4K Quality'] },
];

export default function UpgradeModal({ isOpen, onClose }:any) {
  const { user, updateUserPlanLocally } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. NEW: Dynamic Script Loader for Next.js
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
    if (!user) return toast.error("Please login to upgrade.");
    setLoadingPlan(planName);

    try {
      // 2. NEW: Ensure Razorpay is loaded before proceeding
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load Razorpay SDK. Check your connection.");
        setLoadingPlan(null);
        return;
      }

      const { data: order } = await axiosInstance.post('/payment/create-order', { plan: planName });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "YouTube Clone Premium",
        description: `Upgrade to ${planName}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await axiosInstance.post('/payment/verify', {
              ...response,
              plan: planName,
              userId: user._id,
              userEmail: user.email
            });
            updateUserPlanLocally(planName);
            toast.success(`Welcome to the ${planName}!`);
            onClose();
          } catch (err) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#3B82F6" },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      console.error(error);
      toast.error("Could not initiate payment. Make sure backend routes exist!");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      {/* ... (Keep your exact same beautiful UI code here from before) ... */}
      <div className="bg-card text-card-foreground max-w-4xl w-full rounded-2xl shadow-2xl relative overflow-hidden border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={24} />
        </button>
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-2">Upgrade Your Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {PLANS.map((plan) => (
              <div key={plan.name} className="border border-border bg-background rounded-xl p-6 flex flex-col">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-4xl font-extrabold my-4">₹{plan.price}</div>
                <button 
                  onClick={() => handlePayment(plan.name, plan.price)}
                  disabled={loadingPlan === plan.name}
                  className="mt-auto py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  {loadingPlan === plan.name ? 'Processing...' : 'Upgrade Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}