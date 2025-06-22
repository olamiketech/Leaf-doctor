import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { ExternalLink, LogIn, UserPlus, ArrowDown, Leaf, Camera, Cloud, CheckCircle2, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  const [, navigate] = useLocation();
  
  // Refs for each section for smooth scrolling
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  
  // Function to handle smooth scrolling to sections
  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Handle hash navigation when page loads
  useEffect(() => {
    // Check if there's a hash in the URL
    const hash = window.location.hash;
    
    if (hash) {
      // Remove the '#' character
      const sectionId = hash.substring(1);
      
      // Scroll to the appropriate section
      setTimeout(() => {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Give a little time for everything to render
    }
  }, []);
  
  return (
    <div className="bg-[#F8F9FA]">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Highlight */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
              Why Choose LeafDoctor?
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Our AI-powered platform offers unique features designed specifically for plant health management
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
            >
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">Instant Detection</h3>
              <p className="text-gray-600">
                Take a photo and get accurate disease identification within seconds using our advanced AI model.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
            >
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">Treatment Plans</h3>
              <p className="text-gray-600">
                Get custom treatment recommendations and preventive measures for identified plant diseases.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
            >
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Cloud className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">Works Offline</h3>
              <p className="text-gray-600">
                Use LeafDoctor in the field without internet connection. Data syncs when you're back online.
              </p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
            >
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">Premium Analytics</h3>
              <p className="text-gray-600">
                Unlock advanced insights and tracking features with our premium subscription.
              </p>
            </motion.div>
          </div>
          
          <div className="flex justify-center mt-12">
            <Button
              onClick={() => scrollToSection(howItWorksRef)}
              variant="ghost"
              className="text-[#2C3E50] hover:text-[#2ECC71] group"
            >
              Learn More
              <ArrowDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* CTA to Login/Register */}
      <div className="py-16 bg-gradient-to-br from-[#2ECC71] to-[#27AE60]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 md:mb-0 text-center md:text-left"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Ready to Diagnose Your Plants?
              </h2>
              <p className="text-white/90 text-lg">
                Sign in or create an account to start using LeafDoctor's AI diagnosis tools.
              </p>
              <div className="flex flex-wrap mt-4 space-y-2 md:space-y-0 md:space-x-4 text-white">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-white/80" />
                  <span>Free to get started</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-white/80" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-white/80" />
                  <span>Unlimited diagnoses</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
            >
              <Button
                onClick={() => navigate("/auth?tab=login")}
                className="bg-white text-[#2ECC71] hover:bg-white/90 shadow-lg px-6 py-3 h-auto transform hover:scale-105 transition-all"
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </Button>
              
              <Button
                onClick={() => navigate("/auth?tab=register")}
                className="bg-[#27AE60] hover:bg-[#219653] text-white shadow-lg px-6 py-3 h-auto border-2 border-white/20 transform hover:scale-105 transition-all"
                size="lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Register Now
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div id="how-it-works" ref={howItWorksRef}>
        <HowItWorksSection />
      </div>
      
      {/* Testimonials Section */}
      <div id="testimonials" ref={testimonialsRef}>
        <TestimonialsSection />
      </div>
      
      {/* About Section */}
      <div id="about" ref={aboutRef}>
        <AboutSection />
      </div>
      
      {/* Final CTA */}
      <div className="py-16 bg-gradient-to-r from-[#2ECC71]/90 to-[#27AE60]">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Join Thousands of Plant Enthusiasts Using LeafDoctor
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Start diagnosing plant diseases with AI precision today. 
              Create your free account and get access to our powerful plant disease detection tools.
            </p>
            
            <Button
              onClick={() => navigate("/auth?tab=register")}
              className="bg-white text-[#2ECC71] hover:bg-white/90 shadow-lg px-8 py-3 h-auto transform hover:scale-105 transition-all"
              size="lg"
            >
              Get Started Now
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}