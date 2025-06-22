import localforage from 'localforage';
import type { Diagnosis, UsageMetrics, DiagnosisStats } from '@shared/schema';

// Define the structure for offline image uploads
interface OfflineImageUpload {
  id: string;
  imageData: string; // Base64 encoded image
  timestamp: number;
  attempts: number;
}

// Define local analytics metrics
export interface LocalAnalytics {
  diagnosisCount: number;
  diseaseTypes: Record<string, number>;
  confidenceLevels: number[];
  diagnosesByDate: Record<string, number>;
  lastUpdated: number;
}

// Define user usage metrics
export interface LocalUsageMetrics {
  metrics: UsageMetrics[];
  topDiseases: DiagnosisStats[];
  lastSynced: number;
}

// Initialize our storage
export const initOfflineStorage = async () => {
  try {
    // Configure localforage
    localforage.config({
      name: 'LeafDoctor',
      storeName: 'plantDiagnostics',
      description: 'Local storage for offline data'
    });
    
    // Create necessary stores if they don't exist
    await localforage.getItem('networkStatus');
    await localforage.getItem('recentDiagnoses');
    await localforage.getItem('userDiagnoses');
    await localforage.getItem('userData');
    await localforage.getItem('pendingUploads');
    await localforage.getItem('localAnalytics');
    await localforage.getItem('usageMetrics');
    
    console.log('Offline storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize offline storage:', error);
    return false;
  }
};

// Cache recent diagnoses for quick access
export const cacheRecentDiagnoses = async (diagnoses: Diagnosis[]) => {
  try {
    await localforage.setItem('recentDiagnoses', diagnoses);
    return true;
  } catch (error) {
    console.error('Failed to cache recent diagnoses:', error);
    return false;
  }
};

// Get cached recent diagnoses
export const getCachedRecentDiagnoses = async (): Promise<Diagnosis[]> => {
  try {
    const diagnoses = await localforage.getItem<Diagnosis[]>('recentDiagnoses');
    return diagnoses || [];
  } catch (error) {
    console.error('Failed to get cached recent diagnoses:', error);
    return [];
  }
};

// Cache all user diagnoses for offline access
export const cacheUserDiagnoses = async (diagnoses: Diagnosis[]) => {
  try {
    await localforage.setItem('userDiagnoses', diagnoses);
    return true;
  } catch (error) {
    console.error('Failed to cache user diagnoses:', error);
    return false;
  }
};

// Get cached user diagnoses
export const getCachedUserDiagnoses = async (): Promise<Diagnosis[]> => {
  try {
    const diagnoses = await localforage.getItem<Diagnosis[]>('userDiagnoses');
    return diagnoses || [];
  } catch (error) {
    console.error('Failed to get cached user diagnoses:', error);
    return [];
  }
};

// Cache user data for offline access
export const cacheUserData = async (userData: any) => {
  try {
    await localforage.setItem('userData', userData);
    return true;
  } catch (error) {
    console.error('Failed to cache user data:', error);
    return false;
  }
};

// Get cached user data
export const getCachedUserData = async (): Promise<any> => {
  try {
    const userData = await localforage.getItem('userData');
    return userData || null;
  } catch (error) {
    console.error('Failed to get cached user data:', error);
    return null;
  }
};

// Queue an image for upload when back online
export const queueImageForUpload = async (imageData: string): Promise<string> => {
  try {
    // Generate a unique ID for this upload
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create upload object
    const upload: OfflineImageUpload = {
      id: uploadId,
      imageData,
      timestamp: Date.now(),
      attempts: 0
    };
    
    // Get current pending uploads
    const pendingUploads = await localforage.getItem<OfflineImageUpload[]>('pendingUploads') || [];
    
    // Add new upload
    pendingUploads.push(upload);
    
    // Save updated list
    await localforage.setItem('pendingUploads', pendingUploads);
    
    return uploadId;
  } catch (error) {
    console.error('Failed to queue image for upload:', error);
    throw error;
  }
};

// Get all pending uploads
export const getPendingUploads = async (): Promise<OfflineImageUpload[]> => {
  try {
    const pendingUploads = await localforage.getItem<OfflineImageUpload[]>('pendingUploads');
    return pendingUploads || [];
  } catch (error) {
    console.error('Failed to get pending uploads:', error);
    return [];
  }
};

// Remove an upload from the queue (after successful upload)
export const removeUploadFromQueue = async (uploadId: string) => {
  try {
    const pendingUploads = await localforage.getItem<OfflineImageUpload[]>('pendingUploads') || [];
    const updatedUploads = pendingUploads.filter(upload => upload.id !== uploadId);
    await localforage.setItem('pendingUploads', updatedUploads);
    return true;
  } catch (error) {
    console.error('Failed to remove upload from queue:', error);
    return false;
  }
};

// Set network status
export const setNetworkStatus = async (isOnline: boolean) => {
  try {
    await localforage.setItem('networkStatus', isOnline);
    return true;
  } catch (error) {
    console.error('Failed to set network status:', error);
    return false;
  }
};

// Get network status
export const getNetworkStatus = async (): Promise<boolean> => {
  try {
    const status = await localforage.getItem<boolean>('networkStatus');
    return status === null ? navigator.onLine : status;
  } catch (error) {
    console.error('Failed to get network status:', error);
    return navigator.onLine;
  }
};

// Store local analytics data
export const updateLocalAnalytics = async (diagnosis: Diagnosis) => {
  try {
    const defaultAnalytics: LocalAnalytics = {
      diagnosisCount: 0,
      diseaseTypes: {},
      confidenceLevels: [],
      diagnosesByDate: {},
      lastUpdated: Date.now()
    };
    
    // Get current analytics or use default
    const analytics = await localforage.getItem<LocalAnalytics>('localAnalytics') || defaultAnalytics;
    
    // Update diagnosis count
    analytics.diagnosisCount += 1;
    
    // Update disease types
    const diseaseType = diagnosis.disease;
    analytics.diseaseTypes[diseaseType] = (analytics.diseaseTypes[diseaseType] || 0) + 1;
    
    // Update confidence levels
    analytics.confidenceLevels.push(diagnosis.confidence);
    
    // Update diagnoses by date (using date as key in format YYYY-MM-DD)
    const date = new Date(diagnosis.createdAt || Date.now()).toISOString().split('T')[0];
    analytics.diagnosesByDate[date] = (analytics.diagnosesByDate[date] || 0) + 1;
    
    // Update last updated timestamp
    analytics.lastUpdated = Date.now();
    
    // Save updated analytics
    await localforage.setItem('localAnalytics', analytics);
    return true;
  } catch (error) {
    console.error('Failed to update local analytics:', error);
    return false;
  }
};

// Get local analytics
export const getLocalAnalytics = async (): Promise<LocalAnalytics> => {
  try {
    const analytics = await localforage.getItem<LocalAnalytics>('localAnalytics');
    if (!analytics) {
      return {
        diagnosisCount: 0,
        diseaseTypes: {},
        confidenceLevels: [],
        diagnosesByDate: {},
        lastUpdated: Date.now()
      };
    }
    return analytics;
  } catch (error) {
    console.error('Failed to get local analytics:', error);
    return {
      diagnosisCount: 0,
      diseaseTypes: {},
      confidenceLevels: [],
      diagnosesByDate: {},
      lastUpdated: Date.now()
    };
  }
};

// Cache usage metrics
export const cacheUsageMetrics = async (metrics: UsageMetrics[], topDiseases: DiagnosisStats[]) => {
  try {
    const usageMetrics: LocalUsageMetrics = {
      metrics,
      topDiseases,
      lastSynced: Date.now()
    };
    await localforage.setItem('usageMetrics', usageMetrics);
    return true;
  } catch (error) {
    console.error('Failed to cache usage metrics:', error);
    return false;
  }
};

// Get cached usage metrics
export const getCachedUsageMetrics = async (): Promise<LocalUsageMetrics | null> => {
  try {
    const usageMetrics = await localforage.getItem<LocalUsageMetrics>('usageMetrics');
    return usageMetrics;
  } catch (error) {
    console.error('Failed to get cached usage metrics:', error);
    return null;
  }
};

// Clear all cached data (for logout)
export const clearCachedData = async () => {
  try {
    await localforage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear cached data:', error);
    return false;
  }
};