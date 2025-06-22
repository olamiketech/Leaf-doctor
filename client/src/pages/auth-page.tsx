import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { Loader2, Leaf, Eye, EyeOff, Lock, Mail, User, AlertCircle, Check, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Check for tab parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab === 'login' || tab === 'register') {
      setActiveTab(tab);
    }
  }, []);
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);
  
  useEffect(() => {
    // Calculate password strength
    const strength = calculatePasswordStrength(registerData.password);
    setPasswordStrength(strength);
    
    // Check if passwords match
    setPasswordMatch(registerData.password === registerData.confirmPassword || registerData.confirmPassword === "");
  }, [registerData.password, registerData.confirmPassword]);
  
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return Math.min(score, 5); // Max score of 5
  };
  
  // Password strength label
  const getStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 0: return "Very Weak";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      case 5: return "Very Strong";
      default: return "Very Weak";
    }
  };
  
  // Password strength color
  const getStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0: return "bg-red-500";
      case 1: return "bg-red-400";
      case 2: return "bg-yellow-500";
      case 3: return "bg-yellow-400";
      case 4: return "bg-green-400";
      case 5: return "bg-green-500";
      default: return "bg-red-500";
    }
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if passwords match
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }
    
    // Check password strength
    if (passwordStrength < 2) {
      toast({
        title: "Weak Password",
        description: "Please choose a stronger password for better security.",
        variant: "destructive"
      });
      return;
    }
    
    // Submit form if all checks pass
    registerMutation.mutate({
      username: registerData.username,
      email: registerData.email,
      password: registerData.password
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FA]">
      {/* Left side - Authentication Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-[#2ECC71] flex items-center justify-center shadow-md">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-2 text-xl font-semibold font-montserrat text-[#2C3E50]">
                Leaf<span className="text-[#2ECC71]">Doctor</span>
              </h1>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-gray-600 hover:text-[#2ECC71] transition-colors"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
          </motion.div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="transition-all">Login</TabsTrigger>
              <TabsTrigger value="register" className="transition-all">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-md border-0 transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-montserrat text-[#2C3E50]">Welcome Back</CardTitle>
                    <CardDescription>Login to your LeafDoctor account to analyze plant diseases.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username" className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Username or Email</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="login-username" 
                            type="text" 
                            placeholder="Enter your username or email"
                            value={loginData.username}
                            onChange={e => setLoginData({...loginData, username: e.target.value})}
                            className="pl-8 transition-all focus:border-[#2ECC71]"
                            required
                          />
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          <span>Password</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="login-password" 
                            type={showLoginPassword ? "text" : "password"} 
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={e => setLoginData({...loginData, password: e.target.value})}
                            className="pl-8 pr-10 transition-all focus:border-[#2ECC71]"
                            required
                          />
                          <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <button 
                            type="button"
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          >
                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                      <Button 
                        type="submit" 
                        className="w-full bg-[#2ECC71] hover:bg-[#27AE60] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : "Login"}
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Don't have an account? 
                        <button 
                          type="button" 
                          className="text-[#2ECC71] hover:underline ml-1 font-medium"
                          onClick={() => setActiveTab("register")}
                        >
                          Register Now
                        </button>
                      </p>
                    </CardFooter>
                  </form>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="register">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-md border-0 transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-montserrat text-[#2C3E50]">Create Account</CardTitle>
                    <CardDescription>Sign up for a LeafDoctor account to start diagnosing plant diseases.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username" className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Username</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="register-username" 
                            type="text" 
                            placeholder="Choose a username"
                            value={registerData.username}
                            onChange={e => setRegisterData({...registerData, username: e.target.value})}
                            className="pl-8 transition-all focus:border-[#2ECC71]"
                            required
                          />
                          <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="register-email" 
                            type="email" 
                            placeholder="Enter your email"
                            value={registerData.email}
                            onChange={e => setRegisterData({...registerData, email: e.target.value})}
                            className="pl-8 transition-all focus:border-[#2ECC71]"
                            required
                          />
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          <span>Password</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="register-password" 
                            type={showRegisterPassword ? "text" : "password"} 
                            placeholder="Create a password (min 6 characters)"
                            value={registerData.password}
                            onChange={e => setRegisterData({...registerData, password: e.target.value})}
                            className={`pl-8 pr-10 transition-all ${!registerData.password ? "" : passwordStrength < 2 ? "border-red-400" : passwordStrength < 4 ? "border-yellow-400" : "border-green-400"}`}
                            minLength={6}
                            required
                          />
                          <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <button 
                            type="button"
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                          >
                            {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Password strength meter */}
                        {registerData.password && (
                          <div className="space-y-1 mt-1">
                            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                              <div 
                                className={`${getStrengthColor(passwordStrength)} transition-all`} 
                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs flex items-center justify-between">
                              <span className={passwordStrength < 2 ? "text-red-500" : passwordStrength < 4 ? "text-yellow-500" : "text-green-500"}>
                                {getStrengthLabel(passwordStrength)}
                              </span>
                              {passwordStrength >= 4 && (
                                <span className="text-green-500 flex items-center">
                                  <Check className="h-3 w-3 mr-1" /> Secure
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          <span>Confirm Password</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="confirm-password" 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Confirm your password"
                            value={registerData.confirmPassword}
                            onChange={e => setRegisterData({...registerData, confirmPassword: e.target.value})}
                            className={`pl-8 pr-10 transition-all ${!registerData.confirmPassword ? "" : !passwordMatch ? "border-red-400" : "border-green-400"}`}
                            minLength={6}
                            required
                          />
                          <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <button 
                            type="button"
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Password match indicator */}
                        {registerData.confirmPassword && (
                          <p className={`text-xs flex items-center ${passwordMatch ? "text-green-500" : "text-red-500"}`}>
                            {passwordMatch ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Passwords match
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" /> Passwords do not match
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                      <Button 
                        type="submit" 
                        className="w-full bg-[#2ECC71] hover:bg-[#27AE60] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : "Register"}
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Already have an account? 
                        <button 
                          type="button" 
                          className="text-[#2ECC71] hover:underline ml-1 font-medium"
                          onClick={() => setActiveTab("login")}
                        >
                          Login Here
                        </button>
                      </p>
                    </CardFooter>
                  </form>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero Section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-8 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-md text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-6">
            AI-Powered Plant Disease Detection
          </h2>
          <p className="text-lg mb-8">
            Upload photos of your plant leaves and get instant AI diagnosis, treatment recommendations, and expert care advice.
          </p>
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-start"
            >
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">Instant Diagnosis</h3>
                <p className="opacity-90">Get accurate disease identification in seconds</p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="flex items-start"
            >
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">Treatment Plans</h3>
                <p className="opacity-90">Receive detailed treatment recommendations</p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex items-start"
            >
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">Voice Assistant</h3>
                <p className="opacity-90">Get expert advice with our AI voice assistant</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
