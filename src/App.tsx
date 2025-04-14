
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ApiKeyScreen from './pages/ApiKeyScreen';
import HomeScreen from './pages/HomeScreen';
import ConversationScreen from './pages/ConversationScreen';

type Screen = 'api-key' | 'home' | 'conversation';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('api-key');
  const [apiKey, setApiKey] = useState<string | null>(null);

  const handleApiKeyValidation = (key: string) => {
    setApiKey(key);
    setCurrentScreen('home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'api-key':
        return <ApiKeyScreen onValidApiKey={handleApiKeyValidation} />;
      case 'home':
        return (
          <HomeScreen 
            onStartConversation={() => setCurrentScreen('conversation')}
            onChangeApiKey={() => setCurrentScreen('api-key')}
          />
        );
      case 'conversation':
        return (
          <ConversationScreen 
            onHome={() => setCurrentScreen('home')}
          />
        );
      default:
        return <ApiKeyScreen onValidApiKey={handleApiKeyValidation} />;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#1A1A1A]">
        {renderScreen()}
        <Toaster />
        <Sonner />
      </div>
    </TooltipProvider>
  );
};

export default App;
