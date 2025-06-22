import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Diagnosis } from "@shared/schema";

export function useImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("No file selected");
      }

      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/diagnose", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Special handling for monthly limit errors
        if (response.status === 403 && errorData.error === 'MONTHLY_LIMIT_REACHED') {
          // If user can start trial
          if (errorData.canStartTrial) {
            throw new Error(
              `${errorData.message} 🌿 Start your 30-day free trial to access unlimited diagnoses and premium features.`,
              { cause: { type: 'TRIAL_AVAILABLE' } }
            );
          }
          // If user already used trial
          else if (errorData.trialUsed) {
            throw new Error(
              `${errorData.message} 🌿 Upgrade to our Premium plan for unlimited diagnoses, detailed treatment plans, and AI voice assistant.`,
              { cause: { type: 'UPGRADE_NEEDED' } }
            );
          } 
          // Default message
          else {
            throw new Error(
              `${errorData.message} 🌿 Upgrade to our Premium plan for unlimited diagnoses, detailed treatment plans, and AI voice assistant.`,
              { cause: { type: 'MONTHLY_LIMIT' } }
            );
          }
        }
        
        // Trial active but error message
        if (response.status === 403 && errorData.error === 'TRIAL_ACTIVE') {
          throw new Error(
            `${errorData.message} You can continue diagnosing plants during your trial period.`,
            { cause: { type: 'TRIAL_ACTIVE', daysLeft: errorData.trialDaysLeft } }
          );
        }
        
        // Format non-plant image errors more clearly
        if (errorData.message && (
          errorData.message.includes("not appear to contain") || 
          errorData.message.includes("not a plant")
        )) {
          throw new Error(`❌ ${errorData.message} Please upload a clear image of tomato, potato, or pepper plant leaves.`);
        }
        
        throw new Error(errorData.message || "Failed to upload image");
      }

      return await response.json() as Diagnosis;
    },
    onSuccess: (diagnosis) => {
      toast({
        title: "Diagnosis complete",
        description: `Disease detected: ${diagnosis.disease}`,
      });
      
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses/recent"] });
      
      // Clear the selected file
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return {
    selectedFile,
    previewUrl,
    handleFileSelect,
    clearFile,
    uploadMutation,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    diagnosis: uploadMutation.data,
  };
}
