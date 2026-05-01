import React, { useState } from 'react';
import Head from 'next/head';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import { toast } from 'sonner';
import { Check, Star } from 'lucide-react';

const plans = [
  {
    name: 'Bronze Plan',
    price: 10,
    watchTime: '7 minutes',
    downloads: 'Unlimited',
    features: ['7 minutes watch limit per video', 'Unlimited downloads', 'No ads'],
    color: 'border-[#cd7f32] bg-[#cd7f32]/10',
    buttonColor: 'bg-[#cd7f32] hover:bg-[#b06d2b]'
  },
  {
    name: 'Silver Plan',
    price: 50,
    watchTime: '10 minutes',
    downloads: 'Unlimited',
    features: ['10 minutes watch limit per video', 'Unlimited downloads', 'Priority support', 'No ads'],
    color: 'border-slate-400 bg-slate-400/10',
    buttonColor: 'bg-slate-500 hover:bg-slate-600'
  },
  {
    name: 'Gold Plan',
    price: 100,
    watchTime: 'Unlimited',
    downloads: 'Unlimited',
    features: ['Unlimited watch time', 'Unlimited downloads', '24/7 Priority support', 'No ads', '4K Streaming'],
    color: 'border-yellow-500 bg-yellow-500/10',
    buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
  }
];

export default function Premium() {
  const { user, login } = useUser();
  const [loading, setLoading] = useState(false);

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planName: string, price: number) => {
    if (!user) {
      toast.error('Please login to upgrade your plan');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await initializeRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      // Create Order
      const { data: order } = await axiosInstance.post('/payment/create-order', { plan: planName });
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SIoUfQlQAsPqMO", 
        amount: order.amount,
        currency: order.currency,
        name: 'Youtube Clone',
        description: `Upgrade to ${planName}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await axiosInstance.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
              plan: planName,
              email: user.email
            });
            
            if (verifyRes.status === 200) {
              toast.success(`Successfully upgraded to ${planName}! Invoice sent to email.`);
              // Update local user state
              login({ ...user, plan: planName });
            }
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#3399cc',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Premium Plans - Youtube Clone</title>
      </Head>
      <div className="flex-1 w-full bg-[#0f0f0f] text-white p-6 md:p-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <Star className="text-yellow-500 w-10 h-10" />
              Youtube Premium
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Upgrade your viewing experience. Watch longer, download more, and enjoy an ad-free experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`rounded-2xl border-2 p-8 flex flex-col relative overflow-hidden transition-transform hover:-translate-y-2 ${plan.color}`}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">₹{plan.price}</span>
                    <span className="text-gray-300">/one-time</span>
                  </div>
                </div>

                <ul className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.name, plan.price)}
                  disabled={loading || user?.plan === plan.name}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors ${plan.buttonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {user?.plan === plan.name ? 'Current Plan' : loading ? 'Processing...' : 'Upgrade Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
