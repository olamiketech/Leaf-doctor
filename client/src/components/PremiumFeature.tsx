import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface PremiumFeatureProps {
  onActivate?: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
  secondaryButtonText?: string;
  featureList?: string[];
  icon?: React.ReactNode;
}

export default function PremiumFeature({ 
  onActivate, 
  title = "AI Voice Assistant", 
  description = "Get detailed voice explanations about plant diseases and treatment options with our AI assistant powered by advanced language models.",
  buttonText = "Upgrade to Premium",
  secondaryButtonText = "Start Free Trial",
  featureList,
  icon = <Mic className="h-6 w-6" />
}: PremiumFeatureProps) {
  const { user, startTrialMutation } = useAuth();

  const handleStartTrial = () => {
    startTrialMutation.mutate();
  };

  return (
    <Card className="shadow-lg border-0 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] w-full h-1"></div>
      
      <CardHeader className="pt-6 pb-0">
        <div className="flex items-center mb-2">
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
            {icon}
          </div>
          <CardTitle className="text-xl font-semibold font-montserrat text-[#2C3E50]">{title}</CardTitle>
        </div>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 pb-6">
        {featureList && featureList.length > 0 && (
          <ul className="mb-6 space-y-3">
            {featureList.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-[#2ECC71] mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        )}
        
        {user?.isPremium && onActivate ? (
          <Button 
            className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:opacity-90 transition-opacity"
            onClick={onActivate}
          >
            <Mic className="h-5 w-5 mr-2" />
            Ask Voice Assistant
          </Button>
        ) : (
          <div className="space-y-3">
            <Link href="/subscription">
              <Button className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:opacity-90 transition-opacity">
                {buttonText}
              </Button>
            </Link>
            
            {secondaryButtonText && (
              <Button 
                variant="outline" 
                className="w-full border-[#3498DB] text-[#3498DB] hover:bg-[#3498DB]/5"
                onClick={handleStartTrial}
                disabled={startTrialMutation.isPending}
              >
                {startTrialMutation.isPending ? "Processing..." : secondaryButtonText}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
