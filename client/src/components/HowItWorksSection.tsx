import { Camera, Upload, Search, Zap, Microscope, Pill, Activity, ArrowRight, CheckCircle, Database, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
};

const steps: Step[] = [
  {
    id: 1,
    title: "Upload a Photo",
    description: "Take a picture of the affected plant leaf or part showing symptoms using your device camera, or upload an existing image.",
    icon: <Upload className="h-8 w-8" />,
    color: "bg-blue-100 text-blue-600",
    benefits: ["Works with any smartphone camera", "Supports multiple file formats", "Secure image storage"],
  },
  {
    id: 2,
    title: "AI Analysis",
    description: "Our cutting-edge AI model instantly analyzes the image to identify plant diseases with up to 99% accuracy.",
    icon: <Microscope className="h-8 w-8" />,
    color: "bg-purple-100 text-purple-600",
    benefits: ["Advanced neural network technology", "Trained on millions of plant images", "Constantly improving accuracy"],
  },
  {
    id: 3,
    title: "Detailed Results",
    description: "Receive a comprehensive diagnosis with confidence score, disease classification, and affected plant identification.",
    icon: <Eye className="h-8 w-8" />,
    color: "bg-orange-100 text-orange-600",
    benefits: ["Visual disease markers highlighted", "Severity assessment", "Similar case comparisons"],
  },
  {
    id: 4,
    title: "Treatment Plan",
    description: "Access scientifically-backed treatment recommendations and preventive measures customized for your specific plant disease.",
    icon: <Pill className="h-8 w-8" />,
    color: "bg-green-100 text-green-600",
    benefits: ["Step-by-step treatment guides", "Natural & chemical options", "Expected recovery timeline"],
  },
  {
    id: 5,
    title: "Progress Tracking",
    description: "Monitor plant health recovery with our timeline tools and get reminders for treatment application.",
    icon: <Activity className="h-8 w-8" />,
    color: "bg-red-100 text-red-600",
    benefits: ["Visual progress markers", "Treatment effectiveness scoring", "Long-term plant health monitoring"],
  },
  {
    id: 6,
    title: "Voice Assistant",
    description: "Use our AI voice assistant for hands-free guidance, additional information, and answers to your plant care questions.",
    icon: <Zap className="h-8 w-8" />,
    color: "bg-yellow-100 text-yellow-600",
    benefits: ["Hands-free operation", "Natural language Q&A", "Integration with diagnosis results"],
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [, navigate] = useLocation();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  
  // Auto-rotate through steps
  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setActiveStep(current => current < steps.length ? current + 1 : 1);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isInView]);
  
  const activeStepData = steps.find(step => step.id === activeStep) || steps[0];
  
  return (
    <div className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white to-[#F8FCFA]" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center bg-[#2ECC71]/10 px-4 py-2 rounded-full mb-4">
            <span className="text-[#2ECC71] font-semibold text-sm">Simple Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4">
            How LeafDoctor Works
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our advanced AI platform makes plant disease diagnosis simple, accurate, and accessible
          </p>
        </motion.div>
        
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-16">
          {/* Step numbers on the left - desktop only */}
          <div className="hidden lg:flex flex-col space-y-6 relative">
            {/* Vertical line connecting steps */}
            <div className="absolute left-6 top-8 h-[calc(100%-40px)] w-1 bg-gray-200 rounded-full"></div>
            
            {steps.map((step) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: step.id * 0.1 }}
                className={`relative flex items-center cursor-pointer group`}
                onClick={() => setActiveStep(step.id)}
              >
                <div className={`
                  h-12 w-12 rounded-full flex items-center justify-center z-10
                  transition-all duration-300 
                  ${activeStep === step.id ? 'bg-[#2ECC71] text-white shadow-lg' : 'bg-white text-gray-400 shadow-md group-hover:bg-gray-100'}
                `}>
                  <span className="font-bold">{step.id}</span>
                </div>
                <div className={`
                  ml-4 py-2 px-4 rounded-lg transition-all duration-300
                  ${activeStep === step.id ? 'bg-[#2ECC71]/10 text-[#2C3E50]' : 'text-gray-500 group-hover:bg-gray-50'}
                `}>
                  <span className="font-medium whitespace-nowrap">{step.title}</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Step numbers for tablet/mobile - scrollable */}
          <div className="flex lg:hidden overflow-x-auto gap-2 w-full mb-6 pb-2 px-1 no-scrollbar">
            {steps.map((step) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: step.id * 0.1 }}
                className={`
                  flex-shrink-0 rounded-full py-2 px-3 sm:px-4 cursor-pointer flex items-center
                  ${activeStep === step.id 
                    ? 'bg-[#2ECC71] text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}
                  transition-all duration-200
                `}
                onClick={() => setActiveStep(step.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="font-bold mr-1.5">{step.id}.</span>
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">{step.title}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Active step content */}
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 w-full"
          >
            <div className="p-4 sm:p-6 md:p-8">
              {/* Mobile layout - column */}
              <div className="flex flex-col md:hidden gap-4">
                <div className="flex items-center">
                  <div className={`${activeStepData.color} p-3 rounded-xl mr-4`}>
                    {activeStepData.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#2C3E50]">
                    {activeStepData.id}. {activeStepData.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 text-sm sm:text-base">
                  {activeStepData.description}
                </p>
                
                <div className="mt-2 space-y-2">
                  {activeStepData.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#2ECC71] mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop layout - row */}
              <div className="hidden md:flex items-start gap-4 md:gap-6">
                <div className={`${activeStepData.color} p-4 rounded-2xl flex-shrink-0`}>
                  {activeStepData.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-[#2C3E50] mb-2">
                    {activeStepData.id}. {activeStepData.title}
                  </h3>
                  <p className="text-gray-600 mb-6 md:text-lg">
                    {activeStepData.description}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeStepData.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-[#2ECC71] mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50 flex justify-between items-center">
              <button 
                onClick={() => setActiveStep(current => (current > 1 ? current - 1 : steps.length))}
                className="text-xs sm:text-sm text-gray-500 hover:text-[#2ECC71] flex items-center transition-colors"
                aria-label="Previous step"
              >
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 rotate-180" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <div className="flex space-x-1 sm:space-x-2">
                {steps.map((step) => (
                  <div 
                    key={step.id}
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full cursor-pointer transition-all
                      ${activeStep === step.id ? 'bg-[#2ECC71]' : 'bg-gray-300 hover:bg-gray-400'}
                    `}
                    onClick={() => setActiveStep(step.id)}
                    aria-label={`Go to step ${step.id}`}
                  ></div>
                ))}
              </div>
              <button 
                onClick={() => setActiveStep(current => (current < steps.length ? current + 1 : 1))}
                className="text-xs sm:text-sm text-gray-500 hover:text-[#2ECC71] flex items-center transition-colors"
                aria-label="Next step"
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-[#2ECC71]/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 max-w-3xl mx-auto text-center"
        >
          <h3 className="text-lg sm:text-xl font-bold text-[#2C3E50] mb-2 sm:mb-4">
            Ready to Experience LeafDoctor?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Join thousands of gardeners, farmers, and plant enthusiasts who trust LeafDoctor 
            for accurate plant disease diagnosis and treatment recommendations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                size="lg"
                className="bg-[#2ECC71] hover:bg-[#27AE60] text-white w-full h-auto py-2 sm:py-3"
                onClick={() => navigate("/auth?tab=register")}
              >
                <Database className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Create Free Account</span>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71]/10 w-full h-auto py-2 sm:py-3"
                onClick={() => {
                  const testimonialsSection = document.getElementById('testimonials');
                  if (testimonialsSection) {
                    testimonialsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span className="text-sm sm:text-base">See What Users Say</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}