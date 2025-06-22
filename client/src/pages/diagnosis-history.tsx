import { useQuery } from "@tanstack/react-query";
import { Diagnosis } from "@shared/schema";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import DiagnosisDetail from "@/components/DiagnosisDetail";
import VoiceAssistantModal from "@/components/VoiceAssistantModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, CloudOff, Database, Download, Filter, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCachedUserDiagnoses, getNetworkStatus } from "@/lib/offlineStorage";
import PremiumFeature from "@/components/PremiumFeature";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DiagnosisHistoryPage() {
  const { user, checkTrialStatusQuery } = useAuth();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [offlineDiagnoses, setOfflineDiagnoses] = useState<Diagnosis[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [timeframe, setTimeframe] = useState("all");
  
  // Fetch all diagnoses
  const { data: diagnoses, isLoading } = useQuery<Diagnosis[]>({
    queryKey: ["/api/diagnoses"],
    enabled: user?.isPremium || !!user?.trialStartedAt // Only fetch if premium or in trial
  });
  
  // Check network status and load offline data if needed
  useEffect(() => {
    const checkNetworkAndLoadOfflineData = async () => {
      const networkStatus = await getNetworkStatus();
      setIsOffline(!networkStatus);
      
      if (!networkStatus || !diagnoses) {
        const cachedDiagnoses = await getCachedUserDiagnoses();
        setOfflineDiagnoses(cachedDiagnoses);
      }
    };
    
    checkNetworkAndLoadOfflineData();
  }, [diagnoses]);

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
        const foundDiagnosis = diagnoses?.find(d => d.disease === disease);
        return foundDiagnosis || null;
      });
    }
  };

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

  // Filter and sort diagnoses
  const filterAndSortDiagnoses = (diagnosesData: Diagnosis[]) => {
    let filtered = [...diagnosesData];
    
    // Apply disease type filter
    if (filter !== "all") {
      filtered = filtered.filter(d => d.disease === filter);
    }
    
    // Apply timeframe filter
    if (timeframe !== "all") {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case "last7days":
          startDate.setDate(now.getDate() - 7);
          break;
        case "last30days":
          startDate.setDate(now.getDate() - 30);
          break;
        case "last90days":
          startDate.setDate(now.getDate() - 90);
          break;
        case "thisYear":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      filtered = filtered.filter(d => new Date(d.createdAt) >= startDate);
    }
    
    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "severityHigh":
        filtered.sort((a, b) => {
          const severityMap: Record<string, number> = {
            "high": 3,
            "medium": 2,
            "low": 1,
            "healthy": 0,
            "not applicable": -1
          };
          return severityMap[b.severity.toLowerCase()] - severityMap[a.severity.toLowerCase()];
        });
        break;
      case "diseaseName":
        filtered.sort((a, b) => a.disease.localeCompare(b.disease));
        break;
    }
    
    return filtered;
  };
  
  // Get unique disease names for filter
  const getUniqueDiseases = () => {
    const data = isOffline ? offlineDiagnoses : diagnoses || [];
    // Create a unique array of disease names without using Set
    const uniqueMap: Record<string, boolean> = {};
    data.forEach(d => {
      if (d.disease) {
        uniqueMap[d.disease] = true;
      }
    });
    return Object.keys(uniqueMap);
  };
  
  // Get the actual displayed diagnoses based on online/offline state
  const getDisplayedDiagnoses = () => {
    const data = isOffline ? offlineDiagnoses : diagnoses || [];
    return filterAndSortDiagnoses(data);
  };
  
  const displayedDiagnoses = getDisplayedDiagnoses();
  const uniqueDiseases = getUniqueDiseases();

  return (
    <div className="bg-[#F8F9FA]">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {(!user?.isPremium && (!user?.trialStartedAt || checkTrialStatusQuery?.data?.trialEnded)) ? (
          <PremiumFeature
            title="Full Diagnosis History"
            description="Upgrade to premium to access your complete diagnosis history with advanced filtering and offline access."
            buttonText="Upgrade Now"
            secondaryButtonText="Start Free Trial"
            featureList={[
              "View your complete diagnosis history",
              "Filter and sort diagnoses by different criteria",
              "Access your diagnoses even when offline",
              "Export comprehensive reports"
            ]}
          />
        ) : (
          <>
            <Card className="shadow-md border-0 mb-6">
              <CardHeader>
                <CardTitle className="text-2xl font-montserrat text-[#2C3E50]">Diagnosis History</CardTitle>
                {isOffline && (
                  <CardDescription>
                    <div className="flex items-center text-amber-600 mt-2">
                      <CloudOff className="h-4 w-4 mr-2" />
                      <span>You're currently offline. Viewing cached diagnosis history.</span>
                    </div>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Disease</label>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Diseases" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Diseases</SelectItem>
                        {uniqueDiseases.map(disease => (
                          <SelectItem key={disease} value={disease}>{disease}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Newest First" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="severityHigh">Severity (High to Low)</SelectItem>
                        <SelectItem value="diseaseName">Disease Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                        <SelectItem value="last30days">Last 30 Days</SelectItem>
                        <SelectItem value="last90days">Last 90 Days</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0">
              <CardContent className="pt-6">
                {isLoading && !isOffline ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : displayedDiagnoses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedDiagnoses.map((diagnosis) => (
                      <div 
                        key={diagnosis.id}
                        className="relative rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleShowDetails(diagnosis)}
                      >
                        <div className="h-48 w-full overflow-hidden">
                          <img 
                            src={diagnosis.imageUrl} 
                            alt={diagnosis.disease} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-[#2C3E50]">{diagnosis.disease}</h3>
                            <span className={`text-xs px-2.5 py-1 rounded-full ${getSeverityColor(diagnosis.severity, diagnosis.disease)}`}>
                              {diagnosis.disease === 'Non-Plant Image' 
                                ? 'Not a Plant' 
                                : diagnosis.severity === 'Healthy' 
                                  ? 'Healthy' 
                                  : diagnosis.severity === 'Not Applicable'
                                    ? 'Not Applicable'
                                    : `${diagnosis.severity} Severity`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{diagnosis.description.substring(0, 100)}...</p>
                          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {diagnosis.createdAt ? format(new Date(diagnosis.createdAt), 'MMM dd, yyyy') : 'Date unavailable'}
                            </span>
                            <button className="text-[#3498DB] text-sm font-medium flex items-center">
                              View details
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No diagnosis history found</h3>
                    <p className="text-gray-500">
                      {filter !== "all" || timeframe !== "all" 
                        ? "Try changing your filters to see more results" 
                        : "Upload a plant image to get your first diagnosis"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      
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
