import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, X, Upload, Leaf, FileText, Zap, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import localforage from 'localforage';

export default function SimpleOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Define our onboarding steps
  const steps = [
    {
      title: 'Welcome to LeafDoctor!',
      description: 'Your AI-powered plant disease diagnostic tool.',
      icon: <Leaf className="h-10 w-10 text-green-500" />
    },
    {
      title: 'Upload Plant Photos',
      description: 'Take clear photos of plant leaves and upload them to get instant disease detection.',
      icon: <Upload className="h-10 w-10 text-green-500" />
    },
    {
      title: 'View Diagnoses',
      description: 'Get detailed disease information, confidence scores, and severity ratings.',
      icon: <FileText className="h-10 w-10 text-green-500" />
    },
    {
      title: 'Treatment Plans',
      description: 'Receive custom treatment recommendations for your specific plant disease.',
      icon: <Zap className="h-10 w-10 text-green-500" />
    },
    {
      title: "You're Ready!",
      description: "Start diagnosing your plants right away. Premium users get unlimited diagnoses.",
      icon: <ThumbsUp className="h-10 w-10 text-green-500" />
    }
  ];

  // Check if we should show onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        const onboardingCompleted = await localforage.getItem(`onboarding-completed-${user.id}`);
        setShowOnboarding(!onboardingCompleted);
      }
    };
    
    checkOnboardingStatus();
  }, [user]);

  // Mark onboarding as completed
  const completeOnboarding = async () => {
    if (user) {
      await localforage.setItem(`onboarding-completed-${user.id}`, true);
    }
    setShowOnboarding(false);
  };

  // Handle next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  // Handle skip
  const skipOnboarding = () => {
    completeOnboarding();
  };

  if (!showOnboarding) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] p-4 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 text-white hover:bg-white/20 rounded-full h-8 w-8" 
            onClick={skipOnboarding}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <div className="flex justify-center">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`h-1.5 rounded-full mx-1 ${
                  index === currentStep 
                    ? 'w-8 bg-white' 
                    : index < currentStep 
                      ? 'w-3 bg-white/80' 
                      : 'w-3 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            {steps[currentStep].icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {steps[currentStep].title}
          </h3>
          <p className="text-gray-600 mb-6">
            {steps[currentStep].description}
          </p>
          
          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={skipOnboarding}
              className="text-gray-500 border-gray-300"
            >
              Skip
            </Button>
            <Button 
              onClick={nextStep}
              className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60]"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}