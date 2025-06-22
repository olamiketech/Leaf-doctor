import { useImageUpload } from "@/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, AlertCircle, XCircle, Plus, Clock, Zap, Camera } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function UploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  const { user, startTrialMutation } = useAuth();
  
  const { 
    selectedFile, 
    previewUrl, 
    handleFileSelect, 
    clearFile, 
    uploadMutation,
    isUploading,
    uploadError
  } = useImageUpload();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser. Please try uploading an image instead.');
        return;
      }

      // Show camera modal immediately
      setShowCamera(true);

      let mediaStream;
      
      try {
        // Try back camera first (for mobile) with basic constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (error) {
        console.log('Back camera not available, trying front camera:', error);
        
        try {
          // Fallback to front camera
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
        } catch (fallbackError) {
          console.log('Front camera not available, trying any camera:', fallbackError);
          
          try {
            // Final fallback - any available camera with minimal constraints
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            });
          } catch (finalError) {
            console.log('No camera available with basic constraints:', finalError);
            throw finalError;
          }
        }
      }
      
      console.log('Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setCameraStatus('loading');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Handle video events
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play');
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch((playError) => {
              console.error('Error playing video after metadata loaded:', playError);
              setCameraStatus('error');
            });
          }
        };
        
        videoRef.current.onloadeddata = () => {
          console.log('Video data loaded');
          setCameraStatus('ready');
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can start playing');
          setCameraStatus('ready');
        };
        
        // Force video to play immediately
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Video playing successfully');
            setCameraStatus('ready');
          }).catch((playError) => {
            console.error('Error playing video:', playError);
            setCameraStatus('error');
          });
        }
        
        // Handle video loading errors
        videoRef.current.onerror = (event) => {
          console.error('Video element error:', event);
          alert('Camera video failed to load. Please try again or use the upload option.');
          stopCamera();
        };
        
        // Extended timeout for camera initialization
        setTimeout(() => {
          if (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0)) {
            console.warn('Video dimensions are 0, camera might not be working properly');
            alert('Camera is taking longer than expected to initialize. Please check camera permissions or try the upload option.');
            stopCamera();
          }
        }, 8000); // Increased timeout to 8 seconds
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Could not access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permission in your browser settings and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device. Please try uploading an image instead.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application. Please close other apps using the camera.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints not supported. Please try uploading an image instead.';
      } else {
        errorMessage += 'Please check your camera settings and try again, or use the upload option.';
      }
      
      alert(errorMessage);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      setStream(null);
    }
    setShowCamera(false);
    setCameraStatus('loading');
    
    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    console.log('Attempting to capture photo:', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      currentTime: video.currentTime,
      paused: video.paused
    });
    
    // Check if video dimensions are valid
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Camera video is not displaying properly. Please close and try again, or use the upload option.');
      return;
    }
    
    // Check if video is ready
    if (video.readyState < 2) { // HAVE_CURRENT_DATA
      alert('Camera is still loading. Please wait a moment and try again.');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Check if anything was actually drawn
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some((pixel, index) => 
          index % 4 !== 3 && pixel !== 0 // Check non-alpha channels for non-zero values
        );
        
        if (!hasContent) {
          alert('Camera image appears to be blank. Please ensure camera permissions are granted and try again.');
          return;
        }
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob && blob.size > 1000) { // Ensure blob has reasonable size
            const file = new File([blob], `plant-photo-${Date.now()}.jpg`, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            console.log('Photo captured successfully:', {
              name: file.name,
              size: file.size,
              type: file.type,
              dimensions: `${canvas.width}x${canvas.height}`
            });
            
            handleFileSelect(file);
            stopCamera();
          } else {
            alert('Failed to capture photo or photo is too small. Please try again.');
          }
        }, 'image/jpeg', 0.8);
        
      } catch (error) {
        console.error('Error during photo capture:', error);
        alert('Failed to capture photo. Please try again or use the upload option.');
      }
    } else {
      alert('Canvas context not available. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-primary");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary");
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset UI states
    setShowTrialPrompt(false);
    setShowUpgradePrompt(false);
    
    if (selectedFile) {
      uploadMutation.mutate();
    }
  };
  
  const handleStartTrial = () => {
    startTrialMutation.mutate();
    setShowTrialPrompt(false);
  };

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg sm:text-xl font-montserrat text-[#2C3E50]">Diagnose Your Plant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {!previewUrl ? (
            <div 
              className="upload-area border-2 border-dashed border-gray-300 rounded-lg h-48 sm:h-64 p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#2ECC71] transition-colors"
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-[#2ECC71] mb-2 sm:mb-4" />
              <p className="text-[#2C3E50] font-medium mb-1 text-sm sm:text-base text-center">Drag & drop your leaf image here</p>
              <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 text-center">or choose an option below</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  type="button" 
                  className="bg-[#2ECC71] hover:bg-[#27AE60] flex items-center text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Upload Image
                </Button>
                <Button 
                  type="button" 
                  className="bg-[#3498DB] hover:bg-[#2980B9] flex items-center text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                >
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Take Photo
                </Button>
              </div>
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden h-48 sm:h-64">
              <img 
                src={previewUrl} 
                alt="Plant leaf preview" 
                className="w-full h-full object-contain"
              />
              <Button 
                type="button"
                variant="destructive" 
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8"
                onClick={clearFile}
              >
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center">
                <span className="text-white font-medium truncate max-w-[120px] sm:max-w-[200px] text-xs sm:text-sm">
                  {selectedFile?.name}
                </span>
                <Button 
                  type="submit" 
                  className="bg-[#2ECC71] hover:bg-[#27AE60] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto"
                  disabled={isUploading}
                >
                  {isUploading ? "Analyzing..." : "Diagnose"}
                </Button>
              </div>
            </div>
          )}

          {uploadError && (
            <>
              {/* Check for trial available errors */}
              {uploadError.cause?.type === 'TRIAL_AVAILABLE' ? (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex flex-col w-full">
                    <AlertDescription className="text-xs sm:text-sm text-blue-800">
                      {uploadError.message}
                    </AlertDescription>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-[#3498DB] to-[#2980B9] hover:opacity-90 text-xs sm:text-sm"
                        onClick={handleStartTrial}
                        disabled={startTrialMutation.isPending}
                      >
                        {startTrialMutation.isPending ? "Starting Trial..." : "Start Free Trial"}
                      </Button>
                      <Link href="/subscription">
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:opacity-90 text-xs sm:text-sm w-full"
                        >
                          Upgrade to Premium
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Alert>
              ) : uploadError.cause?.type === 'UPGRADE_NEEDED' ? (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <Zap className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex flex-col w-full">
                    <AlertDescription className="text-xs sm:text-sm text-green-800">
                      {uploadError.message}
                    </AlertDescription>
                    <div className="mt-2">
                      <Link href="/subscription">
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:opacity-90 text-xs sm:text-sm"
                        >
                          Upgrade to Premium
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Alert>
              ) : uploadError.cause?.type === 'TRIAL_ACTIVE' ? (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex flex-col w-full">
                    <AlertDescription className="text-xs sm:text-sm text-blue-800">
                      {uploadError.message}
                      {uploadError.cause.daysLeft && (
                        <span className="font-medium"> (Trial ends in {uploadError.cause.daysLeft} days)</span>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              ) : (
                // Default error alert
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-col w-full">
                    <AlertDescription className="text-xs sm:text-sm">
                      {uploadError.message}
                    </AlertDescription>
                    
                    {uploadError.message.includes('Upgrade to our Premium') && (
                      <div className="mt-2">
                        <Link href="/subscription">
                          <Button 
                            size="sm" 
                            className="bg-[#2ECC71] hover:bg-[#27AE60] text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Upgrade to Premium
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </Alert>
              )}
            </>
          )}
          
          <div className="mt-4 sm:mt-6 flex items-center">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] flex items-center justify-center text-white flex-shrink-0">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="ml-2 sm:ml-3">
              <h3 className="font-medium text-[#2C3E50] text-sm sm:text-base">Pro Tip</h3>
              <p className="text-xs sm:text-sm text-gray-500">For best results, take a clear photo in natural light with the leaf centered in frame.</p>
            </div>
          </div>
        </form>
        
        {/* Camera Interface */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 max-w-md w-full">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 sm:h-80 bg-gray-800 rounded-lg object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay with instructions */}
                <div className="absolute top-2 left-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
                  <div className="flex items-center justify-between">
                    <span>Position your plant leaf in the center</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Camera frame guide */}
                <div className="absolute inset-4 border-2 border-white border-opacity-50 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#2ECC71]"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#2ECC71]"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#2ECC71]"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#2ECC71]"></div>
                </div>
                
                {/* Camera status indicator */}
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <p className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {cameraStatus === 'loading' && "Initializing camera..."}
                    {cameraStatus === 'ready' && "Camera ready"}
                    {cameraStatus === 'error' && "Camera error - try upload instead"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 justify-center">
                <Button
                  onClick={capturePhoto}
                  className="bg-[#2ECC71] hover:bg-[#27AE60] flex items-center px-6 py-2"
                  disabled={cameraStatus !== 'ready'}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraStatus === 'ready' ? 'Capture Photo' : 'Loading...'}
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex items-center px-6 py-2"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
              
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                  Make sure the leaf is well-lit and clearly visible
                </p>
                {cameraStatus === 'loading' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Camera is starting up - this may take a few seconds
                  </p>
                )}
                {cameraStatus === 'error' && (
                  <p className="text-xs text-orange-600 mt-1">
                    Camera not working properly - try allowing permissions or use upload instead
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
