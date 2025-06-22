import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Leaf, Award, Zap, FileCheck, Headphones, MoveUpRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";

export default function SubscriptionPage() {
  const { 
    user, 
    createPaymentIntentMutation,
    startTrialMutation, 
    checkTrialStatusQuery
  } = useAuth();
  
  // Fetch trial status when component mounts
  useEffect(() => {
    if (user && !user.isPremium) {
      checkTrialStatusQuery.refetch();
    }
  }, [user]);
  
  const handleUpgradeSubscription = () => {
    // Use the new Stripe-based payment flow
    createPaymentIntentMutation.mutate();
  };
  
  const handleStartTrial = () => {
    startTrialMutation.mutate();
  };
  
  // Check if user is in trial
  const isInTrial = user?.trialStartedAt && checkTrialStatusQuery.data?.isInTrial;
  const trialEnded = user?.trialStartedAt && checkTrialStatusQuery.data?.trialEnded;
  const daysLeft = checkTrialStatusQuery.data?.daysLeft;

  return (
    <div className="bg-[#F8F9FA]">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-montserrat text-[#2C3E50] mb-8">Subscription Plans</h1>
          
          {/* Current Subscription Status */}
          <Card className="mb-10 shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-xl font-montserrat text-[#2C3E50]">Your Subscription</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#2C3E50]">
                    {user?.isPremium 
                      ? "Premium Plan" 
                      : isInTrial 
                        ? "Free Trial" 
                        : "Standard Plan"}
                  </h3>
                  {user?.isPremium && user?.premiumUntil && (
                    <p className="text-sm text-gray-500">
                      Active until {format(new Date(user.premiumUntil), 'MMMM dd, yyyy')}
                    </p>
                  )}
                  {isInTrial && daysLeft !== null && (
                    <p className="text-sm text-gray-500">
                      Trial ends in {daysLeft} days
                    </p>
                  )}
                  {trialEnded && (
                    <p className="text-sm text-red-500">
                      Your trial has ended
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-white text-sm ${
                  user?.isPremium 
                    ? 'bg-gradient-to-r from-[#2ECC71] to-[#27AE60]' 
                    : isInTrial 
                      ? 'bg-gradient-to-r from-[#3498DB] to-[#2980B9]' 
                      : 'bg-gray-400'
                }`}>
                  {user?.isPremium 
                    ? "PREMIUM" 
                    : isInTrial 
                      ? "TRIAL" 
                      : "STANDARD"}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Subscription Plans */}
          <div className="grid grid-cols-1 gap-8 max-w-lg mx-auto">
            {/* Premium Plan */}
            <Card className="shadow-lg border-0 relative overflow-hidden">
              {/* Premium badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white text-xs py-1 px-3 rounded-bl-lg font-medium">
                RECOMMENDED
              </div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-2">
                  <CardTitle className="text-xl font-montserrat text-[#2C3E50]">Premium Plan</CardTitle>
                  <Award className="h-6 w-6 text-[#2ECC71]" />
                </div>
                <CardDescription>Advanced features for serious gardeners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#2C3E50]">$5.00</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#2ECC71] mr-2 flex-shrink-0" />
                    <span><strong>Unlimited</strong> plant disease diagnoses</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#2ECC71] mr-2 flex-shrink-0" />
                    <span><strong>Premium AI voice assistant</strong> for detailed advice</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#2ECC71] mr-2 flex-shrink-0" />
                    <span>Detailed treatment plans with step-by-step instructions</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#2ECC71] mr-2 flex-shrink-0" />
                    <span>Full diagnosis history & exportable reports</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#2ECC71] mr-2 flex-shrink-0" />
                    <span>Priority processing for faster results</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:opacity-90"
                  disabled={user?.isPremium || createPaymentIntentMutation.isPending}
                  onClick={handleUpgradeSubscription}
                >
                  {createPaymentIntentMutation.isPending ? (
                    "Processing..."
                  ) : user?.isPremium ? (
                    "Current Plan"
                  ) : (
                    "Upgrade to Premium"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Trial Card - Only show if not premium and not in trial already */}
          {!user?.isPremium && !isInTrial && !trialEnded && (
            <Card className="mt-10 mb-10 shadow-lg border-0 bg-gradient-to-r from-[#3498DB]/10 to-[#2980B9]/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white text-xs py-1 px-3 rounded-bl-lg font-medium">
                LIMITED TIME
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-montserrat text-[#2C3E50] flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-[#3498DB]" />
                  Start Your 30-Day Free Trial
                </CardTitle>
                <CardDescription>
                  Try all premium features free for 30 days, no credit card required
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#3498DB] mr-2 flex-shrink-0" />
                    <span>Unlimited plant disease diagnoses for 30 days</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#3498DB] mr-2 flex-shrink-0" />
                    <span>Full access to AI voice assistant</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-[#3498DB] mr-2 flex-shrink-0" />
                    <span>No credit card required, cancel anytime</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-[#3498DB] to-[#2980B9] hover:opacity-90 text-white"
                  disabled={startTrialMutation.isPending}
                  onClick={handleStartTrial}
                >
                  {startTrialMutation.isPending ? "Processing..." : "Start Free Trial"}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Trial ended notice */}
          {trialEnded && (
            <Card className="mt-10 mb-10 shadow-lg border-0 bg-gradient-to-r from-orange-100 to-amber-100 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-montserrat text-[#2C3E50] flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-amber-500" />
                  Your Trial Has Ended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Your 30-day free trial has ended. Upgrade to Premium to continue enjoying unlimited diagnoses and premium features.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:opacity-90"
                  disabled={createPaymentIntentMutation.isPending}
                  onClick={handleUpgradeSubscription}
                >
                  {createPaymentIntentMutation.isPending ? "Processing..." : "Upgrade to Premium"}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Premium Features */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold font-montserrat text-[#2C3E50] mb-8">Premium Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-[#2ECC71] mr-4 flex-shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-[#2C3E50]">Unlimited Diagnoses</h3>
                  <p className="text-gray-600">
                    Analyze as many plants as you need without any monthly limits. Perfect for gardeners with large collections or agricultural professionals.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-[#2ECC71] mr-4 flex-shrink-0">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-[#2C3E50]">AI Voice Assistant</h3>
                  <p className="text-gray-600">
                    Get detailed voice explanations about plant diseases and treatment options with our AI-powered voice assistant.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-[#2ECC71] mr-4 flex-shrink-0">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-[#2C3E50]">Detailed Reports</h3>
                  <p className="text-gray-600">
                    Download comprehensive diagnosis reports with treatment timelines, preventive measures, and care instructions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-[#2ECC71] mr-4 flex-shrink-0">
                  <MoveUpRight className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-[#2C3E50]">Priority Processing</h3>
                  <p className="text-gray-600">
                    Skip the queue with priority processing for faster diagnosis results, especially useful during peak seasons.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
