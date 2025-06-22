import { FaLinkedin, FaTwitter } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import founderImage from "../assets/founder-image.jpeg";

export default function AboutSection() {
  return (
    <div id="about" className="py-10 sm:py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2 text-center">About LeafDoctor</h2>
        <p className="text-gray-500 text-center mb-8 sm:mb-10 max-w-2xl mx-auto text-sm sm:text-base">Revolutionizing plant disease diagnosis with cutting-edge AI technology</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Founder Info */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#2C3E50] mb-2">Meet Our Founder</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    Michael Salami is the visionary founder and CEO of LeafDoctor. With a background in agricultural technology and 
                    artificial intelligence, Michael created LeafDoctor to address the critical challenges facing farmers and plant enthusiasts worldwide.
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    Having grown up in a farming community, Michael witnessed firsthand how plant diseases could devastate crops and livelihoods. 
                    This inspired him to leverage the power of AI to create accessible tools for early disease detection and treatment.
                  </p>
                  <div className="flex space-x-4">
                    <a 
                      href="https://www.linkedin.com/in/michael-salami-4b1a6518b/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-[#0A66C2] hover:underline transition-colors text-sm sm:text-base"
                    >
                      <FaLinkedin className="mr-1 h-4 w-4" />
                      <span>LinkedIn</span>
                    </a>
                    <a 
                      href="https://x.com/olamiketech/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-[#1DA1F2] hover:underline transition-colors text-sm sm:text-base"
                    >
                      <FaTwitter className="mr-1 h-4 w-4" />
                      <span>Twitter</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Founder Image & Mission */}
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-[#2ECC71]/10 to-[#2ECC71]/30 p-4 sm:p-5">
              <div className="bg-white rounded-lg overflow-hidden mb-3 sm:mb-4 shadow-sm">
                <img 
                  src={founderImage} 
                  alt="Michael Salami - Founder & CEO" 
                  className="w-48 h-48 sm:w-64 sm:h-64 object-cover object-center rounded-full mx-auto"
                />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-[#2C3E50] mb-1 sm:mb-2">Our Mission</h4>
              <p className="text-sm sm:text-base text-gray-600">
                At LeafDoctor, we're committed to democratizing access to advanced plant disease diagnostics. 
                Our mission is to help preserve plant health globally through accessible technology 
                that empowers everyone from commercial farmers to home gardeners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}