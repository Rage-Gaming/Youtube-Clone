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

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user, updateUserPlanLocally } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayment = async (planName: string, price: number) => {
    if (!user) return toast.error("Please login to upgrade.");
    setLoadingPlan(planName);

    try {
      // 1. Create Order on Backend
      const { data: order } = await axiosInstance.post('/payment/create-order', { plan: planName });

      // 2. Open Razorpay Checkout Window
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Ensure this is in your frontend .env.local
        amount: order.amount,
        currency: order.currency,
        name: "Your YouTube Clone",
        description: `Upgrade to ${planName}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment on Backend
            await axiosInstance.post('/payment/verify', {
              ...response,
              plan: planName,
              userId: user._id, // Assumes MongoDB _id is present in your user object
              userEmail: user.email
            });

            // 4. Update UI instantly
            updateUserPlanLocally(planName);
            toast.success(`Welcome to the ${planName}! Unlimited downloads unlocked.`);
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
      toast.error("Could not initiate payment. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-card text-card-foreground max-w-4xl w-full rounded-2xl shadow-2xl relative overflow-hidden border border-border">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-2">Upgrade Your Experience</h2>
          <p className="text-center text-muted-foreground mb-8">
            You've hit your daily limit. Choose a premium plan for unlimited downloads and extended watch times!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.name} 
                className="border border-border bg-background rounded-xl p-6 flex flex-col hover:border-primary transition-all duration-300 hover:shadow-lg"
              >
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-4xl font-extrabold my-4">₹{plan.price}</div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle size={18} className="text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handlePayment(plan.name, plan.price)}
                  disabled={loadingPlan === plan.name}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
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