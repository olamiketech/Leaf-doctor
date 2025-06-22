import { Diagnosis } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Download, Mic, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useCallback } from "react";

interface DiagnosisDetailProps {
  diagnosis: Diagnosis;
  onClose: () => void;
  onVoiceAssistant: (disease: string) => void;
}

export default function DiagnosisDetail({ diagnosis, onClose, onVoiceAssistant }: DiagnosisDetailProps) {
  const { user } = useAuth();
  
  const confidencePct = Math.round(diagnosis.confidence * 100);
  
  // Add keyboard event handler for Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Set up event listener for keyboard navigation
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    // Add overflow hidden to body to prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);
  
  const handleVoiceAssistant = () => {
    onVoiceAssistant(diagnosis.disease);
  };
  
  const handleDownloadReport = () => {
    // Parse the description to separate AI analysis from database description
    let aiAnalysis = "";
    let dbDescription = "";
    
    if (diagnosis.description.includes('AI Analysis:')) {
      aiAnalysis = diagnosis.description.split('AI Analysis:')[1].split('Database Description:')[0].trim();
      dbDescription = diagnosis.description.split('Database Description:')[1]?.trim() || 
                     "Information not available";
    } else {
      dbDescription = diagnosis.description;
    }
    
    // Get plant type from metadata if available
    const plantType = diagnosis.metadata?.plantType || "Unknown";
    
    // Create a text report
    let report = `
Plant Disease Diagnosis Report
=============================

Plant Type: ${plantType}
Disease: ${diagnosis.disease}
Severity: ${diagnosis.severity}
Confidence: ${confidencePct}%
Date: ${new Date(diagnosis.createdAt).toLocaleDateString()}

${aiAnalysis ? `AI Analysis:\n${aiAnalysis}\n\n` : ''}

Description:
${dbDescription}

Treatment Recommendations:
${Array.isArray(diagnosis.treatments) ? diagnosis.treatments.map((t: string, i: number) => `${i+1}. ${t}`).join('\n') : "No treatments available."}
    `;
    
    // Create a blob and download
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plant-diagnosis-${diagnosis.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col my-4">
        {/* Header with better back button */}
        <div className="flex justify-between items-center border-b border-gray-100 p-4 sm:p-6 sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="mr-2 flex-shrink-0 hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <h3 className="text-lg font-semibold font-montserrat text-[#2C3E50]">
              {diagnosis.disease}
            </h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="flex-shrink-0 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: Image and confidence */}
            <div className="flex flex-col h-full">
              <div className="relative h-64 sm:h-72 md:h-80 rounded-lg overflow-hidden mb-4 bg-gray-50 flex items-center justify-center border border-gray-100">
                <img 
                  src={diagnosis.imageUrl} 
                  alt={diagnosis.disease} 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="rounded-lg border p-4 sm:p-5 shadow-sm bg-white">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700">AI Diagnosis Confidence</h4>
                  <p className="text-xs text-gray-500">Based on image analysis accuracy</p>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        confidencePct >= 90 ? 'bg-[#2ECC71]' : 
                        confidencePct >= 75 ? 'bg-[#27AE60]' : 
                        confidencePct >= 60 ? 'bg-[#F39C12]' : 'bg-[#E74C3C]'
                      }`}
                      style={{ width: `${confidencePct}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl sm:text-3xl font-bold">
                      {confidencePct}%
                    </span>
                    <span className="ml-1 text-xs sm:text-sm text-gray-500">confidence</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      confidencePct >= 90 ? 'bg-green-100 text-green-800' : 
                      confidencePct >= 75 ? 'bg-green-50 text-green-600' : 
                      confidencePct >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {
                        confidencePct >= 90 ? 'Very High' : 
                        confidencePct >= 75 ? 'High' : 
                        confidencePct >= 60 ? 'Medium' : 'Low'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column: Analysis and treatments */}
            <div className="flex flex-col h-full">
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
                <h4 className="font-semibold text-[#2C3E50] text-sm mb-3">Analysis Results</h4>
                
                {/* Plant Type Badge */}
                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Plant Type: {diagnosis.metadata?.plantType || "Unknown"}
                  </span>
                </div>
                
                {/* Extract and display the analysis properly */}
                {diagnosis.description.includes('AI Analysis:') ? (
                  <>
                    <div className="mb-4">
                      <h5 className="font-medium text-sm mb-2 text-[#2C3E50] inline-flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        AI Analysis
                      </h5>
                      {/* Extract AI analysis text */}
                      {(() => {
                        const aiAnalysisText = diagnosis.description.split('AI Analysis:')[1].split('Database Description:')[0].trim();
                        const analysisTextLower = aiAnalysisText.toLowerCase();
                        
                        // Check if this is a non-plant image - reduced list that focuses only on complete absence of plants
                        // Removed indicators related to hands/people since we now want to analyze plants even when held by hands
                        const nonPlantIndicators = [
                          "not a plant", "doesn't contain a plant", "does not contain a plant",
                          "not contain plant", "no plant", "cannot identify any plant", 
                          "not see any plant"
                        ];
                        
                        const isNonPlantImage = nonPlantIndicators.some(indicator => 
                          analysisTextLower.includes(indicator)
                        );
                        
                        return (
                          <>
                            {isNonPlantImage && (
                              <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                                <p className="text-sm font-medium text-orange-700">⚠️ Non-plant image detected</p>
                                <p className="text-xs text-orange-600">
                                  This image does not appear to contain any plant material. For accurate diagnosis, 
                                  please upload a photo that shows plant leaves or stems.
                                </p>
                              </div>
                            )}
                            <div className="text-sm text-gray-600 mb-2 max-h-28 sm:max-h-40 overflow-y-auto pr-1 border-l-2 border-blue-100 pl-3">
                              {aiAnalysisText}
                            </div>
                          </>
                        );
                      })()}
                      
                      <h5 className="font-medium text-sm mb-2 text-[#2C3E50] mt-4 inline-flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Database Information
                      </h5>
                      <div className="text-sm text-gray-600 max-h-24 sm:max-h-32 overflow-y-auto pr-1 border-l-2 border-green-100 pl-3">
                        {diagnosis.description.split('Database Description:')[1]?.trim() || 
                        "Information not available"}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 mb-4 max-h-32 overflow-y-auto border-l-2 border-gray-100 pl-3">
                    {diagnosis.description}
                  </p>
                )}
                
                <div className={`mt-2 rounded-lg p-2 inline-block ${
                  diagnosis.severity.toLowerCase() === "high" ? "bg-red-50" : 
                  diagnosis.severity.toLowerCase() === "medium" ? "bg-yellow-50" : 
                  diagnosis.severity.toLowerCase() === "low" ? "bg-yellow-50" : 
                  diagnosis.severity.toLowerCase() === "not applicable" ? "bg-gray-50" : "bg-green-50"
                }`}>
                  <span className="text-xs font-medium text-gray-700">
                    Severity: <span className={`font-semibold ${
                      diagnosis.severity.toLowerCase() === "high" ? "text-red-600" : 
                      diagnosis.severity.toLowerCase() === "medium" ? "text-yellow-600" : 
                      diagnosis.severity.toLowerCase() === "low" ? "text-yellow-600" : 
                      diagnosis.severity.toLowerCase() === "not applicable" ? "text-gray-600" : "text-green-600"
                    }`}>{diagnosis.severity}</span>
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 sm:p-5 flex-grow mb-4">
                <h4 className="font-semibold text-[#2C3E50] text-sm mb-3">Treatment Recommendations</h4>
                <ul className="text-sm text-gray-600 space-y-3 max-h-44 sm:max-h-48 overflow-y-auto pr-1">
                  {Array.isArray(diagnosis.treatments) && diagnosis.treatments.map((treatment: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-[#2ECC71] mr-2 flex-shrink-0" />
                      <span>{treatment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed footer with action buttons */}
        <div className="border-t border-gray-100 p-4 sm:p-5 sticky bottom-0 bg-white rounded-b-xl flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <Button 
            variant="outline" 
            className="border-[#3498DB] text-[#3498DB] hover:bg-[#3498DB] hover:text-white w-full sm:w-auto"
            onClick={handleDownloadReport}
          >
            <Download className="h-5 w-5 mr-2" />
            Download Report
          </Button>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 w-1/2 sm:w-auto"
              onClick={onClose}
            >
              Close
            </Button>
            
            <Button 
              className="bg-[#2ECC71] hover:bg-[#27AE60] w-1/2 sm:w-auto"
              onClick={handleVoiceAssistant}
              disabled={!user?.isPremium}
            >
              <Mic className="h-5 w-5 mr-2" />
              Voice Assistant
              {!user?.isPremium && (
                <span className="ml-1 text-xs">(Premium)</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
