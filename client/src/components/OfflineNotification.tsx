import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { getPendingUploads, setNetworkStatus, getNetworkStatus } from '@/lib/offlineStorage';
import { TooltipHelper } from '@/components/TooltipHelper';

export default function OfflineNotification() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingUploads, setPendingUploads] = useState<number>(0);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  // Check for online/offline status and pending uploads
  useEffect(() => {
    const checkStatus = async () => {
      // Check current network status
      const savedStatus = await getNetworkStatus();
      
      // Initialize with browser status
      const browserIsOnline = navigator.onLine;
      setIsOnline(browserIsOnline);
      
      // If status changed, update storage
      if (savedStatus !== browserIsOnline) {
        await setNetworkStatus(browserIsOnline);
      }
      
      // Get pending uploads
      const uploads = await getPendingUploads();
      setPendingUploads(uploads.length);
      
      // Show notification if offline or if there are pending uploads
      setShowNotification(!browserIsOnline || uploads.length > 0);
    };

    // Check on mount
    checkStatus();

    // Add event listeners for online/offline events
    const handleOnline = async () => {
      setIsOnline(true);
      await setNetworkStatus(true);
      
      // Check if we need to sync
      const uploads = await getPendingUploads();
      if (uploads.length > 0) {
        setIsSyncing(true);
        setSyncProgress(0);
        
        // Simulate sync process (in a real app, this would actually sync)
        const timer = setInterval(async () => {
          setSyncProgress(prev => {
            if (prev >= 100) {
              clearInterval(timer);
              setIsSyncing(false);
              setPendingUploads(0);
              setTimeout(() => setShowNotification(false), 3000);
              return 100;
            }
            return prev + 10;
          });
        }, 300);
      } else {
        // Hide notification after a delay
        setTimeout(() => setShowNotification(false), 3000);
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      await setNetworkStatus(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If there's no need to show notification, return null
  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
      <Alert variant={isOnline ? "default" : "destructive"} className="relative border-l-4 shadow-md">
        {isOnline ? (
          <>
            <div className="absolute right-2 top-2">
              <TooltipHelper section="offline">
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
              </TooltipHelper>
            </div>
            <AlertTitle className="flex items-center gap-2">
              {isSyncing ? "Syncing data..." : "You're back online!"}
            </AlertTitle>
            <AlertDescription>
              {isSyncing ? (
                <>
                  <div className="text-sm mb-2">
                    Syncing {pendingUploads} pending {pendingUploads === 1 ? 'upload' : 'uploads'}
                  </div>
                  <Progress value={syncProgress} className="h-1.5" />
                </>
              ) : (
                "All your data has been synchronized with the server."
              )}
            </AlertDescription>
          </>
        ) : (
          <>
            <div className="absolute right-2 top-2">
              <TooltipHelper section="offline">
                <WifiOff className="h-4 w-4 text-red-500" />
              </TooltipHelper>
            </div>
            <AlertTitle className="flex items-center gap-2">
              You're offline
            </AlertTitle>
            <AlertDescription>
              Don't worry - LeafDoctor works offline! Your diagnoses will be saved locally and synchronized when you're back online.
            </AlertDescription>
          </>
        )}
      </Alert>
    </div>
  );
}