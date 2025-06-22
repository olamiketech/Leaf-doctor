import { useQuery } from "@tanstack/react-query";
import { Diagnosis } from "@shared/schema";
import Header from "@/components/Header";
import UploadSection from "@/components/UploadSection";
import ResultsSection from "@/components/ResultsSection";
import HistorySummary from "@/components/HistorySummary";
import SubscriptionCard from "@/components/SubscriptionCard";
import PremiumFeature from "@/components/PremiumFeature";
import { useState, useEffect, useRef } from "react";
import DiagnosisDetail from "@/components/DiagnosisDetail";
import VoiceAssistantModal from "@/components/VoiceAssistantModal";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import HowItWorksSection from "@/components/HowItWorksSection";

export default function HomePage() {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  // Fetch recent diagnoses
  const { data: recentDiagnoses, isLoading } = useQuery<Diagnosis[]>({
    queryKey: ["/api/diagnoses/recent"],
  });

  useEffect(() => {
    // Setup the refs for scroll navigation
    const uploadSection = document.getElementById('upload-section');
    const howItWorksSection = document.getElementById('how-it-works');
    
    if (uploadSectionRef.current && uploadSection) {
      uploadSection.id = 'upload-section';
    }
    
    if (howItWorksRef.current && howItWorksSection) {
      howItWorksSection.id = 'how-it-works';
    }
  }, []);

  const handleShowDetails = (diagnosis: Diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setShowDetailedView(true);
  };

  const toggleVoiceAssistant = (disease?: string) => {
    setShowVoiceAssistant(!showVoiceAssistant);
    if (disease && !showVoiceAssistant) {
      setSelectedDiagnosis(prevDiagnosis => {
        if (prevDiagnosis && prevDiagnosis.disease === disease) {
          return prevDiagnosis;
        }
        const foundDiagnosis = recentDiagnoses?.find(d => d.disease === disease);
        return foundDiagnosis || null;
      });
    }
  };

  return (
    <div className="bg-[#F8F9FA]">
      <Header />
      
      {/* New Hero Section */}
      <HeroSection />
      
      {/* How It Works Section */}
      <div id="how-it-works" ref={howItWorksRef}>
        <HowItWorksSection />
      </div>

      {/* Main Diagnostic Tool Section */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50]">
              Diagnose Your Plant Now
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              Upload a photo of your affected plant and get an instant AI-powered diagnosis
            </p>
          </div>
          
          <div id="upload-section" ref={uploadSectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <UploadSection />
              
              <ResultsSection 
                diagnoses={recentDiagnoses || []}
                isLoading={isLoading}
                onShowDetails={handleShowDetails}
                showDetailedView={showDetailedView}
                setShowDetailedView={setShowDetailedView}
                selectedDiagnosis={selectedDiagnosis}
                onVoiceAssistant={toggleVoiceAssistant}
              />
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <SubscriptionCard />
              <HistorySummary diagnoses={recentDiagnoses || []} isLoading={isLoading} />
              <PremiumFeature onActivate={() => toggleVoiceAssistant()} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* About Section */}
      <AboutSection />
      
      {/* Diagnosis Detail Modal - Shown when a diagnosis is selected */}
      {selectedDiagnosis && showDetailedView && (
        <DiagnosisDetail 
          diagnosis={selectedDiagnosis} 
          onClose={() => setShowDetailedView(false)}
          onVoiceAssistant={toggleVoiceAssistant}
        />
      )}
      
      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <VoiceAssistantModal 
          onClose={() => setShowVoiceAssistant(false)}
          diseaseContext={selectedDiagnosis?.disease}
        />
      )}
    </div>
  );
}
