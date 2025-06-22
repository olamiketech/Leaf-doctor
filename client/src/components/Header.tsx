import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Leaf, Menu, X, LogIn, UserPlus } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#2ECC71] flex items-center justify-center shadow-md">
              <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="ml-2 text-lg sm:text-xl font-semibold font-montserrat text-[#2C3E50]">
              Leaf<span className="text-[#2ECC71]">Doctor</span>
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Desktop Navigation - Different for logged in users vs visitors */}
          {user ? (
            /* For logged in users */
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm ${location === '/' ? 'text-[#2ECC71]' : ''}`}>
                Home
              </Link>
              <Link href="/history" className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm ${location === '/history' ? 'text-[#2ECC71]' : ''}`}>
                History
              </Link>
              <Link href="/subscription" className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm ${location === '/subscription' ? 'text-[#2ECC71]' : ''}`}>
                Pricing
              </Link>
              {(user?.isPremium || user?.trialStartedAt) && (
                <Link href="/analytics" className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm ${location === '/analytics' || location === '/analytics-dashboard' ? 'text-[#2ECC71]' : ''}`}>
                  Analytics
                </Link>
              )}
            </div>
          ) : (
            /* For visitors */
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => {
                  const howItWorksSection = document.getElementById('how-it-works');
                  if (howItWorksSection) howItWorksSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm bg-transparent border-none cursor-pointer group"
              >
                How It Works
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2ECC71] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </button>
              <button 
                onClick={() => {
                  const testimonialsSection = document.getElementById('testimonials');
                  if (testimonialsSection) testimonialsSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm bg-transparent border-none cursor-pointer group"
              >
                Testimonials
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2ECC71] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </button>
              <button 
                onClick={() => {
                  const aboutSection = document.getElementById('about');
                  if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm bg-transparent border-none cursor-pointer group"
              >
                About
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2ECC71] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </button>
            </div>
          )}
          
          {/* User Profile Button or Login/Register Buttons */}
          <div className="flex items-center space-x-2">
            {user ? (
              /* For logged in users - Profile dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-2 flex items-center">
                    <Avatar>
                      <AvatarFallback className="bg-[#3498DB] text-white">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block ml-2 text-sm font-medium">
                      {user.username}
                    </span>
                    {user.isPremium && (
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white">
                        PRO
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/">Home</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history">History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscription">Subscription</Link>
                  </DropdownMenuItem>
                  {(user?.isPremium || user?.trialStartedAt) && (
                    <DropdownMenuItem asChild>
                      <Link href="/analytics">Analytics</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* For visitors - Login/Register buttons */
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => navigate("/auth?tab=login")}
                >
                  <LogIn className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Login
                </Button>
                <Button
                  className="bg-[#2ECC71] hover:bg-[#27AE60] text-white shadow-sm hover:shadow text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => navigate("/auth?tab=register")}
                >
                  <UserPlus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Register
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-[#2C3E50]" />
              ) : (
                <Menu className="h-5 w-5 text-[#2C3E50]" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu - Different for logged in users vs visitors */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm shadow-lg pb-4 px-4 border-t border-gray-100">
          {user ? (
            /* For logged in users */
            <div className="flex flex-col pt-2">
              <Link 
                href="/" 
                className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm py-3 border-b border-gray-100 flex items-center ${location === '/' ? 'text-[#2ECC71]' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-1 h-5 bg-[#2ECC71] rounded-full mr-2.5 opacity-0"></div>
                Home
              </Link>
              <Link 
                href="/history" 
                className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm py-3 border-b border-gray-100 flex items-center ${location === '/history' ? 'text-[#2ECC71]' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`w-1 h-5 bg-[#2ECC71] rounded-full mr-2.5 ${location === '/history' ? 'opacity-100' : 'opacity-0'}`}></div>
                History
              </Link>
              <Link 
                href="/subscription"
                className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm py-3 border-b border-gray-100 flex items-center ${location === '/subscription' ? 'text-[#2ECC71]' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`w-1 h-5 bg-[#2ECC71] rounded-full mr-2.5 ${location === '/subscription' ? 'opacity-100' : 'opacity-0'}`}></div>
                Pricing
              </Link>
              {(user?.isPremium || user?.trialStartedAt) && (
                <Link 
                  href="/analytics"
                  className={`text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm py-3 border-b border-gray-100 flex items-center ${location === '/analytics' || location === '/analytics-dashboard' ? 'text-[#2ECC71]' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`w-1 h-5 bg-[#2ECC71] rounded-full mr-2.5 ${location === '/analytics' || location === '/analytics-dashboard' ? 'opacity-100' : 'opacity-0'}`}></div>
                  Analytics
                </Link>
              )}
              <button
                className="text-left text-red-500 font-medium text-sm py-3 flex items-center"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <div className="w-1 h-5 rounded-full mr-2.5 opacity-0"></div>
                Logout
              </button>
            </div>
          ) : (
            /* For visitors */
            <div className="flex flex-col pt-2">
              <button
                className="text-left text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm py-3 border-b border-gray-100 flex items-center bg-transparent border-none"
                onClick={() => {
                  const howItWorksSection = document.getElementById('how-it-works');
                  if (howItWorksSection) {
                    howItWorksSection.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <div className="w-1 h-5 bg-[#2ECC71] rounded-full mr-2.5 opacity-0"></div>
                How It Works
              </button>
              <button 
                className="text-left text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm py-3 border-b border-gray-100 flex items-center bg-transparent border-none"
                onClick={() => {
                  const testimonialsSection = document.getElementById('testimonials');
                  if (testimonialsSection) {
                    testimonialsSection.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <div className="w-1 h-5 bg-[#2ECC71] rounded-full mr-2.5 opacity-0"></div>
                Testimonials
              </button>
              <button 
                className="text-left text-[#2C3E50] hover:text-[#2ECC71] transition-colors font-medium text-sm py-3 border-b border-gray-100 flex items-center bg-transparent border-none"
                onClick={() => {
                  const aboutSection = document.getElementById('about');
                  if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <div className="w-1 h-5 bg-[#2ECC71] rounded-full mr-2.5 opacity-0"></div>
                About
              </button>
              <div className="pt-4 flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-center h-10 border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71]/10"
                  onClick={() => {
                    navigate("/auth?tab=login");
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
                <Button
                  className="w-full justify-center h-10 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
                  onClick={() => {
                    navigate("/auth?tab=register");
                    setMobileMenuOpen(false);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
