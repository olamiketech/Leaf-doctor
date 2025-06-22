import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  upgradeSubscriptionMutation: UseMutationResult<any, Error, void>;
  startTrialMutation: UseMutationResult<{ user: SelectUser, daysLeft: number }, Error, void>;
  checkTrialStatusQuery: { data: TrialStatus | undefined, isLoading: boolean, refetch: () => void };
  createPaymentIntentMutation: UseMutationResult<{ clientSecret: string }, Error, void>;
  createSubscriptionMutation: UseMutationResult<{ subscriptionId: string, clientSecret: string }, Error, void>;
  confirmSubscriptionMutation: UseMutationResult<{ isPremium: boolean, premiumUntil: Date | null }, Error, string>;
  resetPremiumStatusMutation: UseMutationResult<{ success: boolean, message: string, user: SelectUser }, Error, void>;
};

type TrialStatus = {
  isInTrial: boolean;
  trialEnded: boolean;
  daysLeft: number | null;
};

type LoginData = Pick<InsertUser, "username" | "password">;
type RegisterData = InsertUser;

const registerSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Validate data
      registerSchema.parse(credentials);
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to LeafDoctor, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-payment-intent");
      return await res.json();
    },
    onSuccess: (data) => {
      // Navigate to checkout page or open stripe modal
      window.location.href = "/checkout?client_secret=" + encodeURIComponent(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Payment setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-subscription");
      return await res.json();
    },
    onSuccess: (data) => {
      // Navigate to checkout page or open stripe modal
      window.location.href = "/subscribe?client_secret=" + encodeURIComponent(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const confirmSubscriptionMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const res = await apiRequest("POST", "/api/subscription/confirm", { paymentIntentId });
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the user data with new premium status
      if (user) {
        queryClient.setQueryData(["/api/user"], {
          ...user,
          isPremium: data.isPremium,
          premiumUntil: data.premiumUntil
        });
      }
      
      toast({
        title: "Subscription activated",
        description: "You now have access to premium features!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription activation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Legacy upgrade method - keeping for backward compatibility
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      // Redirecting to the new Stripe-based flow
      return createPaymentIntentMutation.mutateAsync();
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Trial-related mutations and queries
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trial/start");
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the user data with new trial status
      if (user && data.user) {
        queryClient.setQueryData(["/api/user"], data.user);
        // Refetch trial status after starting trial
        trialStatusQuery.refetch();
      }
      
      toast({
        title: "Trial started",
        description: `Your 30-day free trial has started! You have ${data.daysLeft} days left.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start trial",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Query for trial status
  const trialStatusQuery = useQuery<TrialStatus, Error>({
    queryKey: ["/api/trial/status"],
    queryFn: async () => {
      // Only fetch if user is authenticated and not premium
      if (!user || user.isPremium) {
        return { isInTrial: false, trialEnded: false, daysLeft: null };
      }
      
      const res = await apiRequest("GET", "/api/trial/status");
      return await res.json();
    },
    // Don't auto-fetch if no user is logged in
    enabled: !!user && !user.isPremium,
  });
  
  // Reset premium status (for testing)
  const resetPremiumStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reset-premium-status");
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the user data with the reset premium status
      if (user) {
        queryClient.setQueryData(["/api/user"], data.user);
      }
      
      toast({
        title: "Premium status reset",
        description: "Your premium status has been reset for testing purposes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        upgradeSubscriptionMutation,
        startTrialMutation,
        checkTrialStatusQuery: {
          data: trialStatusQuery.data,
          isLoading: trialStatusQuery.isLoading,
          refetch: trialStatusQuery.refetch
        },
        createPaymentIntentMutation,
        createSubscriptionMutation,
        confirmSubscriptionMutation,
        resetPremiumStatusMutation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
