// Stripe checkout page with payment element
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from '@/hooks/use-toast';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { confirmSubscriptionMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    setStatus('idle');

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    
    if (submitError) {
      setMessage(submitError.message || "An unexpected error occurred.");
      setStatus('error');
      setIsProcessing(false);
      return;
    }

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Don't redirect, we'll handle success manually
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setStatus('error');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setStatus('success');
      setMessage("Payment successful!");
      
      // Confirm subscription on the server
      try {
        await confirmSubscriptionMutation.mutateAsync(paymentIntent.id);
        toast({
          title: "Subscription activated",
          description: "Your premium account is now active!"
        });
        // Redirect to subscription page after a short delay
        setTimeout(() => navigate('/subscription'), 1500);
      } catch (err) {
        toast({
          title: "Error activating subscription",
          description: "Payment was processed but we couldn't activate your subscription. Please contact support.",
          variant: "destructive"
        });
      }
    } else {
      setMessage("Payment processing error.");
      setStatus('error');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {message && (
        <div className={`p-4 rounded-md flex items-center ${
          status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {status === 'success' ? 
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" /> : 
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          }
          <p>{message}</p>
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:opacity-90 text-white"
        disabled={isProcessing || !stripe || !elements || status === 'success'}
      >
        {isProcessing ? (
          <span className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </span>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [, navigate] = useLocation();
  
  // Get client secret from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const secret = searchParams.get("client_secret");
    if (secret) {
      setClientSecret(secret);
    }
  }, []);

  if (!clientSecret) {
    return (
      <div className="bg-[#F8F9FA] min-h-screen">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Card className="max-w-xl mx-auto shadow-md">
            <CardHeader>
              <CardTitle>Payment Required</CardTitle>
              <CardDescription>
                There was an issue initializing the payment. Please go back to the subscription page.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/subscription')}>
                Go to Subscription Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-xl font-montserrat text-[#2C3E50]">Complete Your Purchase</CardTitle>
              <CardDescription>Secure payment for Premium Subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Premium Monthly Subscription</span>
                  <span className="font-medium">$5.00</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">$5.00</span>
                </div>
              </div>
              
              {/* Wrap the form in Elements which provides the stripe context */}
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}