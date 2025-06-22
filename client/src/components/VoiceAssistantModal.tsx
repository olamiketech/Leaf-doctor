import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Mic, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantModalProps {
  onClose: () => void;
  diseaseContext?: string;
}

interface Message {
  role: 'ai' | 'user';
  content: string;
}

export default function VoiceAssistantModal({ onClose, diseaseContext }: VoiceAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initial AI greeting
  useEffect(() => {
    const initialMessage = {
      role: 'ai' as const,
      content: diseaseContext 
        ? `Hello! I'm your plant care assistant. I can provide information about ${diseaseContext} and recommend treatment options. What would you like to know?`
        : "Hello! I'm your plant care assistant. I can provide information about plant diseases and recommend treatment options. What would you like to know?"
    };
    setMessages([initialMessage]);
  }, [diseaseContext]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const voiceAssistantMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/voice-assistant", {
        question,
        diseaseContext
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'ai', content: data.response }]);
    },
    onError: (error: Error) => {
      toast({
        title: "Voice assistant error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    
    // Send to API
    voiceAssistantMutation.mutate(inputValue);
    
    // Clear input
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Not implementing actual voice input for MVP, but the button is there
  const handleMicrophoneClick = () => {
    toast({
      title: "Voice Input",
      description: "Voice input feature coming soon!",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md m-4 p-6 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4" 
          onClick={onClose}
        >
          <X className="h-5 w-5 text-gray-500" />
        </Button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] flex items-center justify-center text-white mb-4">
            <Mic className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold font-montserrat text-[#2C3E50]">Voice Assistant</h3>
          <p className="text-sm text-gray-500 text-center mt-1">
            Ask questions about your plant diagnosis or treatment options
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4 h-48 overflow-y-auto" id="voiceAssistantMessages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex items-start mb-4 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'ai' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] flex items-center justify-center text-white text-xs flex-shrink-0 mr-2">
                  AI
                </div>
              )}
              
              <div className={`${
                message.role === 'ai' 
                  ? 'bg-white' 
                  : 'bg-[#3498DB] bg-opacity-10'
                } rounded-lg p-3 shadow-sm max-w-[75%]`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-[#3498DB] flex items-center justify-center text-white text-xs flex-shrink-0 ml-2">
                  You
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex items-center">
          <Input 
            type="text" 
            placeholder="Type your question here..." 
            className="flex-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={voiceAssistantMutation.isPending}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white hover:opacity-90"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || voiceAssistantMutation.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="ml-2 bg-[#2ECC71] text-white hover:bg-[#27AE60]"
            onClick={handleMicrophoneClick}
            disabled={voiceAssistantMutation.isPending}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
