import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Camera, Leaf, ScrollText, CheckCircle, FileText, BatteryCharging } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types for our tooltip helper
interface TooltipHelperProps {
  section: 'upload' | 'results' | 'diagnostic' | 'treatment' | 'history' | 'premium' | 'offline';
  children?: React.ReactNode;
  className?: string;
}

// Map sections to their help content and icons
const tooltipContent = {
  upload: {
    title: 'How to Take a Good Photo',
    content: 'For best results, take clear photos in natural light with the affected area centered in the frame. Avoid blurry images or extreme close-ups.',
    icon: <Camera className="h-4 w-4" />
  },
  results: {
    title: 'Understanding Results',
    content: 'We show confidence scores to help you understand how certain our AI is about the diagnosis. Green indicates high confidence, yellow medium, and red lower confidence.',
    icon: <Leaf className="h-4 w-4" />
  },
  diagnostic: {
    title: 'Diagnostic Details',
    content: 'Click on any diagnosis to see more details including severity assessment, disease progression, and customized treatment options.',
    icon: <ScrollText className="h-4 w-4" />
  },
  treatment: {
    title: 'Treatment Recommendations',
    content: 'Our AI provides step-by-step treatment plans based on the specific disease and severity. Follow them carefully for best results.',
    icon: <CheckCircle className="h-4 w-4" />
  },
  history: {
    title: 'Diagnosis History',
    content: 'All your previous diagnoses are saved here. Track progress over time or use past treatments that worked well.',
    icon: <FileText className="h-4 w-4" />
  },
  premium: {
    title: 'Premium Features',
    content: 'Premium users get unlimited diagnoses, voice assistant explanations, and detailed treatment plans. Try it free for 30 days.',
    icon: <Leaf className="h-4 w-4" />
  },
  offline: {
    title: 'Offline Mode',
    content: 'LeafDoctor works offline! Your data is saved locally and any uploads will be processed when you are back online.',
    icon: <BatteryCharging className="h-4 w-4" />
  }
};

export function TooltipHelper({ section, children, className = '' }: TooltipHelperProps) {
  const [open, setOpen] = useState(false);
  const content = tooltipContent[section];

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          {children || (
            <Button size="icon" variant="ghost" className={`h-6 w-6 rounded-full ${className}`}>
              <HelpCircle className="h-4 w-4 text-gray-500" />
              <span className="sr-only">Help</span>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent className="p-0 max-w-xs">
          <div className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] p-3 rounded-t-lg flex items-center space-x-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              {content.icon}
            </div>
            <div className="text-white font-medium">{content.title}</div>
          </div>
          <div className="p-3 text-sm text-gray-700">
            {content.content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}