import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { format } from "date-fns";

export default function SubscriptionCard() {
  const { user } = useAuth();

  return (
    <Card className="shadow-md border-0 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#27AE60] opacity-10 rounded-bl-full"></div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-montserrat text-[#2C3E50]">Your Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[#2C3E50]">
              {user?.isPremium ? "Premium Plan" : "Free Plan"}
            </h3>
            {user?.isPremium && user.premiumUntil ? (
              <p className="text-sm text-gray-500">
                Active until {format(new Date(user.premiumUntil), 'MMMM d, yyyy')}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Basic features</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-white text-sm ${
            user?.isPremium 
              ? 'bg-gradient-to-r from-[#2ECC71] to-[#27AE60]' 
              : 'bg-gray-400'
          }`}>
            {user?.isPremium ? "ACTIVE" : "FREE"}
          </span>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm mb-2">{user?.isPremium ? "Premium Benefits" : "Available with Premium"}</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center">
              <Check className="h-4 w-4 text-[#2ECC71] mr-2" />
              <span>Unlimited diagnoses</span>
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 text-[#2ECC71] mr-2" />
              <span>Voice assistant feature</span>
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 text-[#2ECC71] mr-2" />
              <span>Detailed treatment plans</span>
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 text-[#2ECC71] mr-2" />
              <span>Export diagnosis reports</span>
            </li>
          </ul>
        </div>
        
        <Link href="/subscription">
          <Button 
            variant="outline"
            className="w-full border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71] hover:text-white"
          >
            Manage Subscription
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
