
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Home, 
  Pause, 
  Play, 
  RotateCcw, 
  Send,
  Settings
} from 'lucide-react';
import { VoiceVisualizer } from '@/components/ui/VoiceVisualizer';
import { ConversationState, VideoState } from '@/types/gemini';
import { geminiService } from '@/services/GeminiService';
import { toast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface ConversationScreenProps {
  onHome: () => void;
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({ onHome }) => {
  const [conversationState, setConversationState] = useState<ConversationState>({
    isConnected: false,
    isRecording: false,
    isPaused: false,
    conversationDuration: 0,
    aiResponse: ''
  });

  const [videoState, setVideoState] = useState<VideoState>({
    isCameraOn: false,
    currentCamera: 'front'
  });
  
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [speakingIntensity, setSpeakingIntensity] = useState(0.5);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: number;
    
    const startConversation = async () => {
      try {
        // Initialize connection to Gemini
        const apiKey = localStorage.getItem('apiKey');
        
        if (!apiKey) {
          toast({
            title: "API Key Missing",
            description: "Please provide a valid API key.",
            variant: "destructive"
          });
          onHome();
          return;
        }
        
        await geminiService.initialize(apiKey);
        await geminiService.connect();
        
        setConversationState(prev => ({
          ...prev, 
          isConnected: true,
          aiResponse: 'Gemini is ready to chat. Say something or toggle the microphone to start.'
        }));
        
        toast({
          title: "Connected to Gemini",
          description: "Your AI assistant is ready."
        });
        
        // Start timer for conversation duration
        let seconds = 0;
        timer = window.setInterval(() => {
          seconds++;
          setConversationState(prev => ({
            ...prev,
            conversationDuration: seconds
          }));
        }, 1000);
      } catch (error) {
        console.error('Failed to connect to Gemini:', error);
        toast({
          title: "Connection Failed",
          description: "Could not connect to Gemini. Please check your API key and try again.",
          variant: "destructive"
        });
      }
    };

    // Set up event listeners for GeminiService
    geminiService.on('response', (text: string) => {
      setConversationState(prev => ({
        ...prev,
        aiResponse: text
      }));
    });
    
    geminiService.on('speaking', (data: {intensity: number}) => {
      setAiSpeaking(true);
      setSpeakingIntensity(data.intensity);
    });
    
    geminiService.on('turn_complete', () => {
      setAiSpeaking(false);
    });
    
    geminiService.on('mic_on', () => {
      setConversationState(prev => ({
        ...prev,
        isRecording: true
      }));
    });
    
    geminiService.on('mic_off', () => {
      setConversationState(prev => ({
        ...prev,
        isRecording: false
      }));
    });

    startConversation();
    
    // Cleanup
    return () => {
      clearInterval(timer);
      geminiService.disconnect();
    };
  }, [onHome]);

  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextInput]);

  const toggleMic = useCallback(() => {
    geminiService.toggleMic();
  }, []);

  const toggleCamera = useCallback(() => {
    const newCameraState = !videoState.isCameraOn;
    setVideoState(prev => ({
      ...prev,
      isCameraOn: newCameraState
    }));
    geminiService.toggleCamera(newCameraState);
  }, [videoState.isCameraOn]);

  const togglePause = useCallback(() => {
    setConversationState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
    
    // TODO: Implement pause/resume functionality when available in GeminiService
  }, []);

  const toggleTextInput = useCallback(() => {
    setShowTextInput(prev => !prev);
  }, []);

  const handleSendText = useCallback(() => {
    if (!textInput.trim()) return;
    
    geminiService.sendText(textInput);
    setTextInput('');
  }, [textInput]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendText();
    }
  }, [handleSendText]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleGoHome = () => {
    geminiService.disconnect().then(() => {
      onHome();
    });
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col">
      {/* Header */}
      <div className="bg-black/40 p-4 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleGoHome}
          className="text-white hover:bg-white/10"
        >
          <Home />
        </Button>

        <div className="flex items-center space-x-2">
          <div className={`
            w-3 h-3 rounded-full 
            ${conversationState.isConnected ? 'bg-green-500' : 'bg-red-500'}
          `} />
          <span className="text-white">
            {conversationState.isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>

        <div className="text-white">
          {formatDuration(conversationState.conversationDuration)}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-grow relative bg-black">
        {videoState.isCameraOn ? (
          <div className="w-full h-full bg-gray-900">
            {/* Placeholder for video feed */}
            <div className="absolute bottom-4 right-4 bg-white/10 px-3 py-1 rounded-full">
              Live
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
            <div className="flex flex-col items-center space-y-4">
              <Camera className="h-16 w-16 text-gray-600" strokeWidth={1} />
              <p className="text-lg text-gray-400">Camera Off</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Response Section */}
      <div className="bg-black/60 p-4 max-h-[30vh] overflow-y-auto">
        <div className="text-white text-sm">
          {conversationState.aiResponse || 'Waiting for Gemini response...'}
        </div>
      </div>

      {/* Text Input (conditionally rendered) */}
      {showTextInput && (
        <div className="bg-black/70 p-3 flex items-center space-x-2">
          <Input
            ref={textInputRef}
            type="text"
            placeholder="Type your message..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Button 
            size="icon" 
            onClick={handleSendText} 
            className="bg-[#10A37F] hover:bg-[#1ABF9C] text-white"
          >
            <Send size={18} />
          </Button>
        </div>
      )}

      {/* Control Tray */}
      <div className="bg-black/40 p-4 flex justify-around items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMic}
          className={`
            text-white 
            hover:bg-white/10 
            rounded-full
            ${!conversationState.isRecording ? 'text-red-500' : ''}
          `}
        >
          {conversationState.isRecording ? <Mic /> : <MicOff />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCamera}
          className={`
            text-white 
            hover:bg-white/10 
            rounded-full
            ${!videoState.isCameraOn ? 'text-red-500' : ''}
          `}
        >
          {videoState.isCameraOn ? <Camera /> : <CameraOff />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTextInput}
          className={`
            text-white 
            hover:bg-white/10 
            rounded-full
            ${showTextInput ? 'bg-white/20' : ''}
          `}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 rounded-full"
            >
              <Settings />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#1A1A1A] border-gray-800 text-white">
            <SheetHeader>
              <SheetTitle className="text-white">Settings</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">API Settings</h3>
                <Button 
                  onClick={handleGoHome}
                  variant="outline" 
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Change API Key
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Conversation</h3>
                <Button 
                  onClick={togglePause}
                  variant="outline" 
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {conversationState.isPaused ? 'Resume Conversation' : 'Pause Conversation'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center justify-center h-10 w-20">
          <VoiceVisualizer 
            isActive={aiSpeaking || conversationState.isRecording} 
            intensity={aiSpeaking ? speakingIntensity : 0.5}
          />
        </div>
      </div>
    </div>
  );
};

export default ConversationScreen;
