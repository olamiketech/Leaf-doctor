import { motion } from "framer-motion";
import { Camera, ArrowRight, Check, Leaf, AlertTriangle, Pill, Shield, Timer, Globe, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [, navigate] = useLocation();
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    // Set the section to be in view when the component mounts
    // This ensures animations will run properly on initial page load
    setIsInView(true);
  }, []);
  
  const features = [
    { text: "Instant AI-powered plant disease diagnosis", icon: <Timer className="h-4 w-4 text-blue-500" /> },
    { text: "Detailed treatment recommendations", icon: <Pill className="h-4 w-4 text-purple-500" /> },
    { text: "Voice assistant for hands-free guidance", icon: <Globe className="h-4 w-4 text-yellow-500" /> },
    { text: "Track diagnosis history and plant health", icon: <Heart className="h-4 w-4 text-red-500" /> },
    { text: "Works offline for field use", icon: <Shield className="h-4 w-4 text-green-500" /> }
  ];

  return (
    <div className="relative bg-gradient-to-br from-[#F8FCFA] to-[#E8F5E9] py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden mt-16 sm:mt-20">
      {/* Animated decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <motion.div 
          className="absolute top-0 right-0 md:top-10 md:right-10 w-48 sm:w-56 md:w-64 h-48 sm:h-56 md:h-64 bg-[#2ECC71]/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5] 
          }}
          transition={{ 
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut" 
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-10 left-5 md:bottom-20 md:left-20 w-56 sm:w-64 md:w-72 h-56 sm:h-64 md:h-72 bg-[#2ECC71]/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ 
            repeat: Infinity,
            duration: 10,
            ease: "easeInOut" 
          }}
        ></motion.div>
        
        {/* Additional decorative elements */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-4 h-4 bg-[#2ECC71] rounded-full"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.6, 1, 0.6] 
          }}
          transition={{ 
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut" 
          }}
        ></motion.div>
        
        <motion.div
          className="absolute top-2/3 right-1/4 w-3 h-3 bg-[#2ECC71] rounded-full"
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.4, 0.8, 0.4] 
          }}
          transition={{ 
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
            delay: 1
          }}
        ></motion.div>
        
        <motion.div
          className="absolute bottom-1/3 right-1/3 w-6 h-6 bg-[#2ECC71]/60 rounded-full"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.5, 0.9, 0.5] 
          }}
          transition={{ 
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut",
            delay: 2
          }}
        ></motion.div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="inline-block bg-[#2ECC71]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <span className="text-[#2ECC71] font-semibold text-xs sm:text-sm flex items-center">
                <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                AI-Powered Plant Disease Detection
              </span>
            </div>
            
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#2C3E50] leading-tight"
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Your Plants' <br className="md:block hidden" />
              <span className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-transparent bg-clip-text inline-block">Personal Doctor</span>
            </motion.h1>
            
            <motion.p 
              className="text-gray-600 text-base sm:text-lg max-w-xl"
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              LeafDoctor uses cutting-edge artificial intelligence to identify plant diseases instantly, 
              provide tailored treatment recommendations, and help you maintain thriving plants and crops.
            </motion.p>
            
            <motion.div 
              className="space-y-3 sm:space-y-4"
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="flex items-center group"
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white shadow-md flex items-center justify-center mr-2 sm:mr-3 group-hover:shadow-lg transition-all">
                    {feature.icon}
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 group-hover:text-[#2C3E50] transition-colors">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4"
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-[#2ECC71] hover:bg-[#27AE60] text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto h-auto py-2.5 sm:py-3"
                  onClick={() => navigate("/auth?tab=register")}
                >
                  <Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Start Diagnosis Now</span>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71]/10 hover:text-[#2ECC71] transition-all w-full sm:w-auto h-auto py-2.5 sm:py-3"
                  onClick={() => {
                    const howItWorksSection = document.getElementById('how-it-works');
                    if (howItWorksSection) {
                      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="text-sm sm:text-base">Learn How It Works</span>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500"
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#2ECC71]" />
              <span>No credit card required to start</span>
            </motion.div>
          </motion.div>
          
          {/* Right column - Interactive illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative px-2 sm:px-0 mt-8 lg:mt-0"
          >
            {/* Floating elements - responsive positioning */}
            <motion.div 
              className="absolute md:-top-10 md:-left-10 top-0 -left-3 w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 bg-white rounded-lg shadow-xl z-10 flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <div className="text-center">
                <div className="font-bold text-lg sm:text-xl md:text-2xl text-[#2ECC71]">99%</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">Accuracy</div>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute md:-bottom-5 md:-right-5 -bottom-3 -right-3 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-white rounded-lg shadow-xl z-10 flex items-center justify-center p-2 md:p-3"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
            >
              <div className="text-center">
                <div className="flex justify-center">
                  <Pill className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-[#2ECC71]" />
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-700 mt-1">Treatment Plans</div>
              </div>
            </motion.div>
            
            {/* Main app preview - responsive sizing */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 transform rotate-1 hover:rotate-0 transition-all duration-500 max-w-full mx-auto lg:mx-0">
              <div className="relative">
                <div className="bg-gradient-to-br from-[#E8F5E9] to-white p-2 sm:p-3 md:p-6">
                  <div className="w-full max-w-sm mx-auto">
                    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                      {/* App header */}
                      <div className="bg-[#2ECC71] text-white p-2 sm:p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"></div>
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white/50"></div>
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white/30"></div>
                          </div>
                          <div className="text-xs sm:text-sm font-medium">LeafDoctor Diagnosis</div>
                        </div>
                        <div className="flex items-center text-[10px] sm:text-xs bg-white/20 rounded-full px-2 py-0.5">
                          <motion.span
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            AI Analyzing...
                          </motion.span>
                        </div>
                      </div>

                      {/* App content */}
                      <div className="p-3 sm:p-4 bg-white">
                        {/* Image and upload info */}
                        <div className="flex space-x-3 sm:space-x-4 items-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2ECC71]/10 rounded-lg flex items-center justify-center p-1">
                            <img 
                              src="https://images.unsplash.com/photo-1569482049809-30bc2c488f76?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=300&ixid=MnwxfDB8MXxyYW5kb218MHx8dG9tYXRvLGxlYWZ8fHx8fHwxNzA0NTI3Mzgx&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=300" 
                              alt="Tomato leaf" 
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm sm:text-base text-[#2C3E50]">Tomato Leaf Analysis</div>
                            <div className="text-xs sm:text-sm text-gray-500">Uploaded: Just now</div>
                            <div className="mt-1 flex items-center">
                              <div className="h-1.5 bg-gray-200 rounded-full w-16 sm:w-24 overflow-hidden">
                                <motion.div 
                                  className="h-full bg-[#2ECC71] rounded-full"
                                  animate={{ width: ["0%", "100%"] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                ></motion.div>
                              </div>
                              <span className="ml-2 text-[10px] sm:text-xs text-gray-500">Analyzing...</span>
                            </div>
                          </div>
                        </div>

                        {/* Diagnosis results */}
                        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs sm:text-sm text-gray-700 font-medium flex items-center">
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 mr-1 sm:mr-2" />
                              Early Blight Detected
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-amber-500">94% Confidence</div>
                          </div>
                          <div className="h-2 sm:h-2.5 bg-gray-200 rounded-full w-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-amber-500 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: "94%" }}
                              transition={{ duration: 1.5, delay: 0.5 }}
                            ></motion.div>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 flex items-start mt-1 sm:mt-2 bg-amber-50 p-1.5 sm:p-2 rounded-md border border-amber-100">
                            <Leaf className="h-3 w-3 sm:h-4 sm:w-4 text-[#2ECC71] mr-1 sm:mr-2 mt-0.5 flex-shrink-0" />
                            <span>Alternaria solani fungus affecting leaflets. Symptoms include dark spots with yellow halos.</span>
                          </div>
                        </div>

                        {/* Treatment recommendations */}
                        <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#2C3E50]">Recommended Treatment:</h4>
                          <div className="flex items-start space-x-1 sm:space-x-2">
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#2ECC71] mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-600">Apply copper-based fungicide</span>
                          </div>
                          <div className="flex items-start space-x-1 sm:space-x-2">
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#2ECC71] mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-600">Remove affected leaves</span>
                          </div>
                          <div className="hidden sm:flex items-start space-x-1 sm:space-x-2">
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#2ECC71] mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-600">Improve air circulation</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-3 sm:mt-4 flex justify-between">
                          <Button 
                            className="bg-[#2ECC71] hover:bg-[#27AE60] text-white text-[10px] sm:text-xs p-1.5 sm:p-2 h-auto shadow"
                            size="sm"
                          >
                            <Pill className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            Treatment Plan
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-gray-200 text-gray-600 hover:bg-gray-50 text-[10px] sm:text-xs p-1.5 sm:p-2 h-auto"
                            size="sm"
                          >
                            Save to History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}