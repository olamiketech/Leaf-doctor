import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Diagnosis } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import DiagnosisDetail from "./DiagnosisDetail";

interface ResultsSectionProps {
  diagnoses: Diagnosis[];
  isLoading: boolean;
  onShowDetails: (diagnosis: Diagnosis) => void;
  showDetailedView: boolean;
  setShowDetailedView: (show: boolean) => void;
  selectedDiagnosis: Diagnosis | null;
  onVoiceAssistant: (disease: string) => void;
}

export default function ResultsSection({
  diagnoses,
  isLoading,
  onShowDetails,
  showDetailedView,
  setShowDetailedView,
  selectedDiagnosis,
  onVoiceAssistant
}: ResultsSectionProps) {
  
  const getSeverityColor = (severity: string, disease?: string) => {
    // Special case for non-plant images
    if (disease === "Non-Plant Image") {
      return 'bg-orange-500 text-white';
    }
    
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-[#E74C3C] text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-yellow-400 text-white';
      case 'healthy':
        return 'bg-green-500 text-white';
      case 'not applicable':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-montserrat text-[#2C3E50]">Recent Diagnosis Results</CardTitle>
          {diagnoses.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
              Last updated: {format(new Date(), 'MMMM d, h:mm a')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white shadow-md">
                <Skeleton className="h-40 sm:h-48 w-full" />
                <div className="p-3 sm:p-4">
                  <div className="flex flex-wrap justify-between items-start mb-2 gap-1">
                    <Skeleton className="h-5 sm:h-6 w-28 sm:w-40" />
                    <Skeleton className="h-4 sm:h-5 w-16 sm:w-20 rounded-full" />
                  </div>
                  
                  {/* Skeleton for confidence score bar */}
                  <div className="mb-2 sm:mb-3 flex items-center">
                    <Skeleton className="h-3 w-16 sm:w-20 mr-2" />
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-6 sm:w-8 ml-2" />
                  </div>
                  
                  <Skeleton className="h-3 sm:h-4 w-full my-1 sm:my-2" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-3/4 mb-2 sm:mb-3" />
                  <div className="border-t border-gray-100 pt-2 sm:pt-3 flex justify-between items-center">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : diagnoses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[...diagnoses]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by newest first
              // We're now allowing non-plant images to be displayed
              // The server now creates special 'Non-Plant Image' diagnoses
              .slice(0, 4)
              .map((diagnosis) => (
              <div 
                key={diagnosis.id}
                className="relative rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => onShowDetails(diagnosis)}
              >
                <div className="h-40 sm:h-48 w-full overflow-hidden">
                  <img 
                    src={diagnosis.imageUrl} 
                    alt={diagnosis.disease} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex flex-wrap justify-between items-start mb-2 gap-1">
                    <h3 className="font-semibold text-sm sm:text-base text-[#2C3E50] mr-1">{diagnosis.disease}</h3>
                    <span className={`text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap ${getSeverityColor(diagnosis.severity, diagnosis.disease)}`}>
                      {diagnosis.disease === 'Non-Plant Image' 
                        ? 'Not a Plant' 
                        : diagnosis.severity === 'Healthy' 
                          ? 'Healthy' 
                          : `${diagnosis.severity} Severity`}
                    </span>
                  </div>
                  
                  {/* Plant Type Badge */}
                  {diagnosis.metadata?.plantType && diagnosis.disease !== 'Non-Plant Image' && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {diagnosis.metadata.plantType}
                      </span>
                    </div>
                  )}
                  
                  {/* Mini confidence score visualization */}
                  <div className="mb-2 sm:mb-3 flex items-center">
                    <span className="text-xs text-gray-500 mr-2 whitespace-nowrap">AI Confidence:</span>
                    <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          Math.round(diagnosis.confidence * 100) >= 90 ? 'bg-[#2ECC71]' : 
                          Math.round(diagnosis.confidence * 100) >= 75 ? 'bg-[#27AE60]' : 
                          Math.round(diagnosis.confidence * 100) >= 60 ? 'bg-[#F39C12]' : 'bg-[#E74C3C]'
                        }`}
                        style={{ width: `${Math.round(diagnosis.confidence * 100)}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs font-medium">{Math.round(diagnosis.confidence * 100)}%</span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
                    {diagnosis.description.includes('AI Analysis:') 
                      ? diagnosis.description.split('AI Analysis:')[1].split('Database Description:')[0].trim()
                      : diagnosis.description
                    }
                  </p>
                  
                  <div className="border-t border-gray-100 pt-2 sm:pt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {diagnosis.createdAt ? format(new Date(diagnosis.createdAt), 'MMM d, yyyy') : 'Date unavailable'}
                    </span>
                    <button className="text-[#3498DB] text-xs sm:text-sm font-medium flex items-center">
                      View details
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-600 mb-2">No diagnosis results yet</h3>
            <p className="text-gray-500">Upload a plant image to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
