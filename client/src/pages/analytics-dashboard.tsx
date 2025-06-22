import { useQuery } from "@tanstack/react-query";
import { DiagnosisStats, UsageMetrics } from "@shared/schema";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { Loader2, BarChart, PieChart, TrendingUp, Calendar, Cloud, Database, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getLocalAnalytics, getCachedUsageMetrics, getNetworkStatus } from "@/lib/offlineStorage";
import PremiumFeature from "@/components/PremiumFeature";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Define chart colors
const CHART_COLORS = [
  '#2ECC71', '#3498DB', '#9B59B6', '#F1C40F', '#E67E22', '#E74C3C', 
  '#1ABC9C', '#2980B9', '#8E44AD', '#F39C12', '#D35400', '#C0392B'
];

export default function AnalyticsDashboardPage() {
  const { user, checkTrialStatusQuery } = useAuth();
  const [timeframe, setTimeframe] = useState("last30days");
  const [isOffline, setIsOffline] = useState(false);
  const [localAnalyticsData, setLocalAnalyticsData] = useState<any>(null);
  const [offlineMetrics, setOfflineMetrics] = useState<{
    metrics: UsageMetrics[];
    topDiseases: DiagnosisStats[];
  } | null>(null);
  
  // Fetch metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<UsageMetrics[]>({
    queryKey: ["/api/analytics/usage"],
    enabled: user?.isPremium || !!user?.trialStartedAt // Only fetch if premium or in trial
  });
  
  // Fetch top diseases
  const { data: topDiseases, isLoading: diseasesLoading } = useQuery<DiagnosisStats[]>({
    queryKey: ["/api/analytics/disease-stats"],
    enabled: user?.isPremium || !!user?.trialStartedAt // Only fetch if premium or in trial
  });
  
  // Check network status and load offline data if needed
  useEffect(() => {
    const checkNetworkAndLoadOfflineData = async () => {
      const networkStatus = await getNetworkStatus();
      setIsOffline(!networkStatus);
      
      if (!networkStatus || !metricsData || !topDiseases) {
        // Load local analytics data
        const analytics = await getLocalAnalytics();
        setLocalAnalyticsData(analytics);
        
        // Load cached usage metrics
        const cachedMetrics = await getCachedUsageMetrics();
        if (cachedMetrics) {
          setOfflineMetrics({
            metrics: cachedMetrics.metrics,
            topDiseases: cachedMetrics.topDiseases
          });
        }
      }
    };
    
    checkNetworkAndLoadOfflineData();
  }, [metricsData, topDiseases]);
  
  // Filter data based on timeframe
  const getFilteredData = () => {
    const data = isOffline ? offlineMetrics?.metrics || [] : metricsData || [];
    
    if (data.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case "last7days":
        startDate = subDays(now, 7);
        break;
      case "last30days":
        startDate = subDays(now, 30);
        break;
      case "last90days":
        startDate = subDays(now, 90);
        break;
      case "thisMonth":
        startDate = startOfMonth(now);
        break;
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(now), 1);
        startDate = startOfMonth(lastMonth);
        return data.filter(m => {
          const date = new Date(m.date);
          return date >= startDate && date <= endOfMonth(lastMonth);
        });
      default:
        startDate = subDays(now, 30); // Default to last 30 days
    }
    
    return data.filter(m => new Date(m.date) >= startDate);
  };
  
  // Prepare data for charts
  const prepareUsageChartData = () => {
    const filteredData = getFilteredData();
    
    return filteredData.map(metric => ({
      date: format(new Date(metric.date), 'MMM dd'),
      scans: metric.diagnosisCount, // Use diagnosisCount instead of scansCompleted
      diseases: metric.diagnosisCount // Use diagnosisCount as a proxy for detected diseases
    }));
  };
  
  const prepareDiseaseChartData = () => {
    const diseases = isOffline 
      ? offlineMetrics?.topDiseases || [] 
      : topDiseases || [];
    
    return diseases.map(disease => ({
      name: disease.diseaseType,
      value: disease.count,
      confidence: (disease.avgConfidence * 100).toFixed(1) // Use avgConfidence instead of averageConfidence
    }));
  };
  
  const calculateStats = () => {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
      return {
        totalScans: 0,
        totalDiseases: 0,
        avgDailyScans: 0,
        daysWithActivity: 0
      };
    }
    
    const totalScans = filteredData.reduce((sum: number, item) => sum + item.diagnosisCount, 0);
    const totalDiseases = filteredData.reduce((sum: number, item) => sum + item.diagnosisCount, 0); // Use diagnosisCount as proxy
    const daysWithActivity = filteredData.filter(item => item.diagnosisCount > 0).length;
    
    // Calculate period length
    const oldestDate = filteredData.reduce((oldest, item) => {
      const date = new Date(item.date);
      return date < oldest ? date : oldest;
    }, new Date());
    
    const periodLength = Math.max(1, differenceInDays(new Date(), oldestDate) || 1);
    const avgDailyScans = totalScans / periodLength;
    
    return {
      totalScans,
      totalDiseases,
      avgDailyScans: parseFloat(avgDailyScans.toFixed(1)),
      daysWithActivity
    };
  };
  
  // Prepare data for local analytics
  const prepareLocalAnalyticsData = () => {
    if (!localAnalyticsData) return null;
    
    // Prepare disease distribution data
    const diseaseData = Object.entries(localAnalyticsData.diseaseTypes).map(([name, count]) => ({
      name,
      value: count as number
    }));
    
    // Prepare daily scans data
    const dailyScansData = Object.entries(localAnalyticsData.diagnosesByDate)
      .map(([date, count]) => ({
        date,
        scans: count as number
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate average confidence
    const avgConfidence = localAnalyticsData.confidenceLevels.length > 0
      ? localAnalyticsData.confidenceLevels.reduce((sum: number, val: number) => sum + val, 0) / localAnalyticsData.confidenceLevels.length
      : 0;
    
    return {
      diseaseData,
      dailyScansData,
      diagnosisCount: localAnalyticsData.diagnosisCount,
      avgConfidence: parseFloat((avgConfidence * 100).toFixed(1))
    };
  };
  
  const usageData = prepareUsageChartData();
  const diseaseData = prepareDiseaseChartData();
  const stats = calculateStats();
  const localData = prepareLocalAnalyticsData();
  const isLoading = metricsLoading || diseasesLoading;

  return (
    <div className="bg-[#F8F9FA]">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {(!user?.isPremium && (!user?.trialStartedAt || checkTrialStatusQuery?.data?.trialEnded)) ? (
          <PremiumFeature
            title="Analytics Dashboard"
            description="Upgrade to premium to access detailed analytics about your plant diagnostics activity."
            buttonText="Upgrade Now"
            secondaryButtonText="Start Free Trial"
            featureList={[
              "Track your diagnosis activity over time",
              "View detailed statistics on detected diseases",
              "See patterns in plant health issues",
              "Access your analytics even when offline",
              "Export data for research or record-keeping"
            ]}
            icon={<BarChart className="h-6 w-6" />}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h1 className="text-3xl font-bold font-montserrat text-[#2C3E50] mb-4 md:mb-0">Analytics Dashboard</h1>
              
              <div className="flex items-center">
                {isOffline && (
                  <div className="flex items-center text-amber-600 mr-4">
                    <Cloud className="h-4 w-4 mr-2" />
                    <span className="text-sm">Offline Mode</span>
                  </div>
                )}
                
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Last 30 Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="last90days">Last 90 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Scans</p>
                      <h3 className="text-2xl font-bold text-[#2C3E50]">
                        {isOffline ? localData?.diagnosisCount || 0 : stats.totalScans}
                      </h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <BarChart className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Diseases Detected</p>
                      <h3 className="text-2xl font-bold text-[#2C3E50]">
                        {isOffline ? Object.keys(localData?.diseaseData || {}).length : stats.totalDiseases}
                      </h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <PieChart className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Avg. Daily Scans</p>
                      <h3 className="text-2xl font-bold text-[#2C3E50]">
                        {stats.avgDailyScans}
                      </h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Avg. Confidence</p>
                      <h3 className="text-2xl font-bold text-[#2C3E50]">
                        {isOffline 
                          ? `${localData?.avgConfidence || 0}%`
                          : diseaseData.length > 0 
                            ? `${(diseaseData.reduce((sum: number, item: any) => sum + Number(String(item.confidence)), 0) / diseaseData.length).toFixed(1)}%` 
                            : '0%'
                        }
                      </h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <div className="h-5 w-5 flex items-center justify-center font-bold">%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tab panels for charts */}
            <Tabs defaultValue="usage" className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
                <TabsTrigger value="diseases">Disease Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="usage">
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnosis Activity</CardTitle>
                    <CardDescription>Your plant scanning activity over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !isOffline ? (
                      <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={isOffline ? localData?.dailyScansData : usageData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="scans" 
                              name="Plant Scans" 
                              stroke="#2ECC71" 
                              strokeWidth={2} 
                              activeDot={{ r: 8 }} 
                            />
                            {!isOffline && (
                              <Line 
                                type="monotone" 
                                dataKey="diseases" 
                                name="Diseases Detected" 
                                stroke="#3498DB" 
                                strokeWidth={2} 
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="diseases">
                <Card>
                  <CardHeader>
                    <CardTitle>Disease Distribution</CardTitle>
                    <CardDescription>Types of diseases detected in your plants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !isOffline ? (
                      <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          {(isOffline ? localData?.diseaseData || [] : diseaseData || []).length > 0 ? (
                            <RechartsPieChart>
                              <Pie
                                data={isOffline ? localData?.diseaseData : diseaseData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              >
                                {(isOffline ? localData?.diseaseData : diseaseData)?.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name, props) => [`Count: ${value}`, props.payload.name]} />
                              <Legend />
                            </RechartsPieChart>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-gray-500">No disease data available for this period</p>
                            </div>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Top Diseases Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top Detected Diseases</CardTitle>
                <CardDescription>The most common plant diseases in your diagnostic history</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && !isOffline ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Disease Name</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Count</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg. Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isOffline ? 
                          Object.entries(localAnalyticsData?.diseaseTypes || {}).map(([name, count]) => ({
                            name,
                            count,
                            confidence: 0 // Local analytics doesn't track confidence per disease
                          })) 
                          : diseaseData
                        )?.length > 0 ? (
                          (isOffline ? 
                            Object.entries(localAnalyticsData?.diseaseTypes || {}).map(([name, count]) => ({
                              name,
                              count,
                              confidence: 0
                            })) 
                            : diseaseData
                          )?.map((disease, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{disease.name}</td>
                              <td className="py-3 px-4 text-center">{(disease as any).value || (disease as any).count}</td>
                              <td className="py-3 px-4 text-center">
                                {isOffline ? 'N/A' : `${disease.confidence}%`}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-gray-500">
                              No disease data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}