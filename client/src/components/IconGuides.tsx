import React from 'react';
import {
  Camera,
  Upload,
  Leaf,
  Microscope,
  Droplet,
  Zap,
  FileText,
  AlertCircle,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  BatteryMedium,
  Cloud,
  Download,
  Loader2,
  Loader,
  BadgeAlert,
  BadgeCheck,
  Maximize,
  Minimize,
  Info,
  HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipHelper } from '@/components/TooltipHelper';

// Upload process icons
export const UploadIcon = () => (
  <div className="relative inline-flex">
    <Upload className="h-5 w-5 text-green-600" />
    <TooltipHelper section="upload" />
  </div>
);

export const CameraIcon = () => (
  <div className="relative inline-flex">
    <Camera className="h-5 w-5 text-green-600" />
    <TooltipHelper section="upload" />
  </div>
);

export const AnalyzingIcon = () => (
  <div className="relative inline-flex">
    <Microscope className="h-5 w-5 text-blue-600" />
    <span className="absolute -top-1 -right-1">
      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
    </span>
  </div>
);

// Disease status icons
export const LeafHealthyIcon = () => (
  <div className="relative inline-flex">
    <Leaf className="h-5 w-5 text-green-600" />
    <span className="absolute -top-1 -right-1">
      <Check className="h-3 w-3 text-green-600" />
    </span>
  </div>
);

export const LeafDiseaseIcon = ({ severity = 'medium' }: { severity?: 'low' | 'medium' | 'high' }) => {
  let color = 'text-yellow-500';
  if (severity === 'low') color = 'text-green-500';
  if (severity === 'high') color = 'text-red-500';
  
  return (
    <div className="relative inline-flex">
      <Leaf className={`h-5 w-5 ${color}`} />
      <span className="absolute -top-1 -right-1">
        <AlertCircle className={`h-3 w-3 ${color}`} />
      </span>
    </div>
  );
};

// Treatment icons
export const TreatmentIcon = () => (
  <div className="relative inline-flex">
    <Droplet className="h-5 w-5 text-blue-600" />
    <TooltipHelper section="treatment" />
  </div>
);

export const PreventionIcon = () => (
  <div className="relative inline-flex">
    <BadgeCheck className="h-5 w-5 text-green-600" />
    <TooltipHelper section="treatment" />
  </div>
);

// Confidence indicators
export const ConfidenceIndicator = ({ level }: { level: number }) => {
  let color = 'bg-yellow-500';
  let label = 'Medium';
  
  if (level >= 0.8) {
    color = 'bg-green-500';
    label = 'High';
  } else if (level < 0.5) {
    color = 'bg-red-500';
    label = 'Low';
  }
  
  return (
    <Badge className={`${color} text-xs py-0.5 hover:${color}`}>
      {label} ({Math.round(level * 100)}%)
    </Badge>
  );
};

export const NotePlantIcon = () => (
  <div className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
    <BadgeAlert className="h-3 w-3 text-orange-500" />
    <span>Not a Plant</span>
  </div>
);

// Connectivity icons
export const OfflineIcon = () => (
  <div className="relative inline-flex">
    <WifiOff className="h-5 w-5 text-amber-600" />
    <TooltipHelper section="offline" />
  </div>
);

export const OnlineIcon = () => (
  <div className="relative inline-flex">
    <Wifi className="h-5 w-5 text-green-600" />
  </div>
);

export const SyncingIcon = () => (
  <div className="relative inline-flex">
    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
  </div>
);

// Storage indicators
export const OfflineStorageIcon = () => (
  <div className="inline-flex items-center gap-1 text-xs text-gray-500">
    <BatteryMedium className="h-3.5 w-3.5" />
    <span>Saved locally</span>
  </div>
);

export const CloudStorageIcon = () => (
  <div className="inline-flex items-center gap-1 text-xs text-gray-500">
    <Cloud className="h-3.5 w-3.5" />
    <span>Saved to cloud</span>
  </div>
);

// Info indicators
export const FeatureInfoIcon = ({ text }: { text: string }) => (
  <div className="inline-flex items-center">
    <Info className="h-4 w-4 text-gray-400 mr-1" />
    <span className="text-xs text-gray-500">{text}</span>
  </div>
);

export const HelpIcon = ({ section }: { section: 'upload' | 'results' | 'diagnostic' | 'treatment' | 'history' | 'premium' | 'offline' }) => (
  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
    <HelpCircle className="h-4 w-4 text-gray-400" />
    <TooltipHelper section={section} />
  </Button>
);