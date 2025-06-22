import { Diagnosis } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";

interface HistorySummaryProps {
  diagnoses: Diagnosis[];
  isLoading: boolean;
}

export default function HistorySummary({ diagnoses, isLoading }: HistorySummaryProps) {
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
        <CardTitle className="text-lg sm:text-xl font-montserrat text-[#2C3E50]">Diagnosis History</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg mr-2 sm:mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Skeleton className="h-3 sm:h-4 w-10 sm:w-12 rounded-full" />
                  </div>
                  
                  {/* Skeleton for confidence indicator */}
                  <div className="flex items-center mt-1 mb-1">
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <Skeleton className="h-2 sm:h-3 w-6 sm:w-8 ml-2" />
                  </div>
                  
                  <Skeleton className="h-2 sm:h-3 w-16 sm:w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : diagnoses.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {[...diagnoses]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by newest first
              // We're now allowing non-plant images to be displayed
              // The server now creates special 'Non-Plant Image' diagnoses
              .slice(0, 4)
              .map((diagnosis) => (
              <div key={diagnosis.id} className="flex items-start p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden mr-2 sm:mr-3 flex-shrink-0">
                  <img 
                    src={diagnosis.imageUrl} 
                    alt={diagnosis.disease}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-start gap-1">
                    <h4 className="font-medium text-xs sm:text-sm text-[#2C3E50] truncate mr-1">{diagnosis.disease}</h4>
                    <span className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full whitespace-nowrap ${getSeverityColor(diagnosis.severity)}`}>
                      {diagnosis.severity === 'Healthy' ? 'Healthy' : diagnosis.severity}
                    </span>
                  </div>
                  
                  {/* Plant Type display */}
                  {diagnosis.metadata?.plantType && diagnosis.disease !== 'Non-Plant Image' && (
                    <div className="mt-1 mb-1">
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                        {diagnosis.metadata.plantType}
                      </span>
                    </div>
                  )}
                  
                  {/* Mini confidence indicator */}
                  <div className="flex items-center mt-1 mb-1">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          Math.round(diagnosis.confidence * 100) >= 90 ? 'bg-[#2ECC71]' : 
                          Math.round(diagnosis.confidence * 100) >= 75 ? 'bg-[#27AE60]' : 
                          Math.round(diagnosis.confidence * 100) >= 60 ? 'bg-[#F39C12]' : 'bg-[#E74C3C]'
                        }`}
                        style={{ width: `${Math.round(diagnosis.confidence * 100)}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs">{Math.round(diagnosis.confidence * 100)}%</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 truncate">
                    {diagnosis.createdAt ? format(new Date(diagnosis.createdAt), 'MMM d, yyyy') : 'Date unavailable'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <p className="text-xs sm:text-sm text-gray-500">No diagnosis history yet</p>
          </div>
        )}
        
        <Link href="/history">
          <Button variant="secondary" className="w-full mt-3 sm:mt-4 text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
            View Full History
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
