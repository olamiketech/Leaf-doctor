import { useEffect, useState } from 'react';
import { ReactShepherd, useShepherdTour } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css';
import './OnboardingTour.css'; // We'll create this next
import { useAuth } from '@/hooks/use-auth';
import localforage from 'localforage';

// Configuration for the tour
const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
    classes: 'shepherd-theme-custom',
    scrollTo: { behavior: 'smooth', block: 'center' }
  },
  useModalOverlay: true
};

// Define the steps in our tour
const steps = [
  {
    id: 'welcome',
    attachTo: {
      element: '.app-container',
      on: 'bottom'
    },
    beforeShowPromise: function() {
      return new Promise<void>(resolve => {
        setTimeout(() => resolve(), 300);
      });
    },
    buttons: [
      {
        action() {
          return this.cancel();
        },
        classes: 'shepherd-button-secondary',
        text: 'Skip Tour'
      },
      {
        action() {
          return this.next();
        },
        text: 'Next'
      }
    ],
    classes: 'custom-class-name-1 custom-class-name-2',
    highlightClass: 'highlight',
    title: 'Welcome to LeafDoctor!',
    text: 'Let us show you around so you can make the most of our plant disease diagnostic app.',
    when: {
      show: () => {
        console.log('Welcome step shown');
      }
    }
  },
  {
    id: 'upload-section',
    attachTo: {
      element: '.upload-area',
      on: 'bottom'
    },
    buttons: [
      {
        action() {
          return this.back();
        },
        classes: 'shepherd-button-secondary',
        text: 'Back'
      },
      {
        action() {
          return this.next();
        },
        text: 'Next'
      }
    ],
    title: 'Upload Your Plant Photo',
    text: 'Take a clear photo of your plant leaves and upload them here. Make sure to center the affected area in good lighting.'
  },
  {
    id: 'results-section',
    attachTo: {
      element: '.results-section',
      on: 'top'
    },
    buttons: [
      {
        action() {
          return this.back();
        },
        classes: 'shepherd-button-secondary',
        text: 'Back'
      },
      {
        action() {
          return this.next();
        },
        text: 'Next'
      }
    ],
    title: 'View Your Results',
    text: 'After uploading, your diagnosis will appear here. We provide disease detection, confidence scores, and treatment recommendations.'
  },
  {
    id: 'premium-features',
    attachTo: {
      element: '.premium-prompt',
      on: 'top'
    },
    buttons: [
      {
        action() {
          return this.back();
        },
        classes: 'shepherd-button-secondary',
        text: 'Back'
      },
      {
        action() {
          return this.next();
        },
        text: 'Next'
      }
    ],
    title: 'Premium Features',
    text: 'With our premium plan, unlock unlimited diagnoses, AI voice assistant, and detailed treatment plans. Try it free for 30 days!'
  },
  {
    id: 'history-section',
    attachTo: {
      element: '.history-summary',
      on: 'top'
    },
    buttons: [
      {
        action() {
          return this.back();
        },
        classes: 'shepherd-button-secondary',
        text: 'Back'
      },
      {
        action() {
          return this.complete();
        },
        text: 'Finish Tour'
      }
    ],
    title: 'Your Diagnosis History',
    text: 'All your previous plant diagnoses are saved here for easy reference. Track your plant health over time!'
  }
];

// Tour component
export const OnboardingTour = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [isTourStarted, setIsTourStarted] = useState(false);
  
  // Initialize the tour
  const tour = useShepherdTour({
    tourOptions, 
    steps
  });

  useEffect(() => {
    // Check if the tour has been completed before
    const checkTourStatus = async () => {
      try {
        // Only show the tour if the user is logged in and hasn't seen it before
        if (user) {
          const tourCompleted = await localforage.getItem(`tourCompleted-${user.id}`);
          if (!tourCompleted) {
            setShowTour(true);
          }
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    };

    checkTourStatus();
  }, [user]);

  // Start the tour when component mounts if it should be shown
  useEffect(() => {
    if (showTour && !isTourStarted) {
      // Start the tour after a short delay to ensure elements are rendered
      const timer = setTimeout(() => {
        tour.start();
        setIsTourStarted(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showTour, isTourStarted, tour]);

  // Mark the tour as completed when the user finishes or skips it
  useEffect(() => {
    const completeTour = async () => {
      if (user) {
        try {
          await localforage.setItem(`tourCompleted-${user.id}`, true);
        } catch (error) {
          console.error('Error saving tour status:', error);
        }
      }
    };

    // Listen to tour events
    const onTourComplete = () => {
      completeTour();
    };

    const onTourCancel = () => {
      completeTour();
    };

    // Add event listeners
    if (tour?.tourObject) {
      tour.tourObject.on('complete', onTourComplete);
      tour.tourObject.on('cancel', onTourCancel);
      
      // Clean up event listeners
      return () => {
        tour.tourObject.off('complete', onTourComplete);
        tour.tourObject.off('cancel', onTourCancel);
      };
    }
  }, [tour, user]);

  // Just render the children
  return <>{children}</>;
};

export default OnboardingTour;