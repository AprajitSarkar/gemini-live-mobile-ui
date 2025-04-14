
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Key, PlayCircle } from 'lucide-react';

interface HomeScreenProps {
  onStartConversation: () => void;
  onChangeApiKey: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onStartConversation, 
  onChangeApiKey 
}) => {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <Bot 
            className="text-[#10A37F] mb-4" 
            size={80} 
            strokeWidth={1.5} 
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            Gemini Live AI
          </h1>
          <p className="text-gray-400 text-center mb-4">
            Your intelligent AI companion for real-time conversations
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={onStartConversation}
            className="
              w-full 
              bg-[#10A37F] 
              hover:bg-[#1ABF9C] 
              text-white 
              transition-transform 
              active:scale-95
              flex items-center justify-center gap-2
            "
          >
            <PlayCircle size={24} />
            Start Live AI Call
          </Button>

          <Button 
            variant="outline"
            onClick={onChangeApiKey}
            className="
              w-full 
              border-gray-700 
              text-gray-300 
              hover:bg-gray-800 
              hover:text-white
              transition-transform 
              active:scale-95
              flex items-center justify-center gap-2
            "
          >
            <Key size={24} />
            Change API Key
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
