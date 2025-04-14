
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Home, 
  Pause, 
  Play, 
  RotateCcw 
} from 'lucide-react';
import { VoiceVisualizer } from '@/components/ui/VoiceVisualizer';
import { ConversationState, VideoState } from '@/types/gemini';

interface ConversationScreenProps {
  onHome: () => void;
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({ onHome }) => {
  const [conversationState, setConversationState] = useState<ConversationState>({
    isConnected: true,
    isRecording: true,
    isPaused: false,
    conversationDuration: 0,
    aiResponse: ''
  });

  const [videoState, setVideoState] = useState<VideoState>({
    isCameraOn: true,
    currentCamera: 'front'
  });

  const toggleMic = () => {
    setConversationState(prev => ({
      ...prev,
      isRecording: !prev.isRecording
    }));
  };

  const toggleCamera = () => {
    setVideoState(prev => ({
      ...prev,
      isCameraOn: !prev.isCameraOn
    }));
  };

  const togglePause = () => {
    setConversationState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col">
      {/* Header */}
      <div className="bg-black/40 p-4 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onHome}
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
            Camera Off
          </div>
        )}
      </div>

      {/* AI Response Section */}
      <div className="bg-black/60 p-4 max-h-[30vh] overflow-y-auto">
        <div className="text-white text-sm">
          {conversationState.aiResponse || 'Waiting for Gemini response...'}
        </div>
      </div>

      {/* Control Tray */}
      <div className="bg-black/40 p-4 flex justify-around items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMic}
          className={`
            text-white 
            hover:bg-white/10 
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
            ${!videoState.isCameraOn ? 'text-red-500' : ''}
          `}
        >
          {videoState.isCameraOn ? <Camera /> : <CameraOff />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={togglePause}
          className="text-white hover:bg-white/10"
        >
          {conversationState.isPaused ? <Play /> : <Pause />}
        </Button>

        <VoiceVisualizer 
          isActive={conversationState.isRecording && !conversationState.isPaused} 
        />
      </div>
    </div>
  );
};

export default ConversationScreen;
