
import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ApiKeyScreen from './pages/ApiKeyScreen';
import HomeScreen from './pages/HomeScreen';
import ConversationScreen from './pages/ConversationScreen';
import { geminiService } from './services/GeminiService';

type Screen = 'api-key' | 'home' | 'conversation';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('api-key');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing API key in localStorage
    const savedApiKey = localStorage.getItem('apiKey');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setCurrentScreen('home');
    }
    
    setIsLoading(false);
    
    // Load script.js dynamically if needed
    if (!window.GeminiAgent) {
      console.log("Script.js functionality not detected, it should be loaded from index.html");
    }
  }, []);

  const handleApiKeyValidation = (key: string) => {
    setApiKey(key);
    setCurrentScreen('home');
  };

  const handleChangeApiKey = () => {
    localStorage.removeItem('apiKey');
    setApiKey(null);
    setCurrentScreen('api-key');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10A37F]"></div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'api-key':
        return <ApiKeyScreen onValidApiKey={handleApiKeyValidation} />;
      case 'home':
        return (
          <HomeScreen 
            onStartConversation={() => setCurrentScreen('conversation')}
            onChangeApiKey={handleChangeApiKey}
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
