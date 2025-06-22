import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaLeaf, FaMapMarkerAlt, FaPhone, FaLinkedin } from 'react-icons/fa';
import { apiRequest } from '@/lib/queryClient';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/newsletter/subscribe', { email });
      const data = await response.json();
      
      if (response.ok) {
        if (data.alreadySubscribed) {
          toast({
            title: 'Already subscribed',
            description: 'This email is already subscribed to our newsletter.',
            variant: 'default',
          });
        } else {
          toast({
            title: 'Success!',
            description: 'You have been subscribed to our newsletter.',
            variant: 'default',
          });
        }
        
        setEmail('');
      } else {
        throw new Error(data.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription failed',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#1E293B] text-white mt-auto pt-8 sm:pt-10 pb-4 sm:pb-6">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <FaLeaf className="text-[#2ECC71] h-5 w-5 sm:h-6 sm:w-6" />
              <h3 className="text-lg sm:text-xl font-bold">LeafDoctor</h3>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm">
              Helping you diagnose and treat plant diseases with AI-powered precision.
            </p>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-[#2ECC71] h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-xs sm:text-sm">
                  110 Strathmore Drive<br />
                  Stirling, United Kingdom<br />
                  FK9 5DS
                </span>
              </li>
              <li className="flex items-center gap-2">
                <FaPhone className="text-[#2ECC71] h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <a href="tel:+447823583837" className="text-gray-300 hover:text-[#2ECC71] transition-colors text-xs sm:text-sm">
                  +44 7823 583837
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FaLinkedin className="text-[#2ECC71] h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <a 
                  href="https://www.linkedin.com/in/michael-salami-4b1a6518b/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-[#2ECC71] transition-colors text-xs sm:text-sm"
                >
                  Connect on LinkedIn
                </a>
              </li>
            </ul>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-[#2ECC71] transition-colors text-xs sm:text-sm inline-flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71]/60 mr-1.5"></span>
                  Home
                </a>
              </li>
              <li>
                <a href="/history" className="text-gray-300 hover:text-[#2ECC71] transition-colors text-xs sm:text-sm inline-flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71]/60 mr-1.5"></span>
                  Diagnosis History
                </a>
              </li>
              <li>
                <a href="/subscription" className="text-gray-300 hover:text-[#2ECC71] transition-colors text-xs sm:text-sm inline-flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71]/60 mr-1.5"></span>
                  Premium Plans
                </a>
              </li>
            </ul>
          </div>
          
          {/* Newsletter Subscription */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Stay in the loop</h4>
            <p className="text-gray-300 text-xs sm:text-sm">Join our newsletter to receive the latest news & exclusive insights from the LeafDoctor.</p>
            
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#2D3748] border-[#4A5568] focus:border-[#2ECC71] text-white text-xs sm:text-sm h-9 sm:h-10"
                  aria-label="Email for newsletter"
                  required
                />
                <Button 
                  type="submit" 
                  className="bg-[#2ECC71] hover:bg-[#27AE60] text-xs sm:text-sm h-9 sm:h-10 whitespace-nowrap"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-gray-400 text-xs sm:text-sm">
          <p>&copy; {new Date().getFullYear()} LeafDoctor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}