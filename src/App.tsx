
import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ApiKeyScreen from './pages/ApiKeyScreen';
import HomeScreen from './pages/HomeScreen';
import ConversationScreen from './pages/ConversationScreen';
import { geminiService } from './services/GeminiService';
import { toast } from '@/hooks/use-toast';

type Screen = 'api-key' | 'home' | 'conversation';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('api-key');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing API key in localStorage
    const savedApiKey = localStorage.getItem('apiKey');
    
    if (savedApiKey) {
      console.log("Found saved API key, attempting to initialize...");
      
      // Try to initialize with the saved API key
      geminiService.initialize(savedApiKey)
        .then(isValid => {
          if (isValid) {
            console.log("API key validated, proceeding to home screen");
            setApiKey(savedApiKey);
            setCurrentScreen('home');
          } else {
            console.error("Saved API key is invalid");
            // If API key is not valid, stay on API key screen
            localStorage.removeItem('apiKey');
            toast({
              title: "Invalid API Key",
              description: "Your saved API key is invalid. Please enter a new one.",
              variant: "destructive",
            });
          }
        })
        .catch(error => {
          console.error("Error initializing with saved API key:", error);
          localStorage.removeItem('apiKey');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      console.log("No saved API key found");
      setIsLoading(false);
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
    <div className="min-h-screen bg-[#1A1A1A]">
      {renderScreen()}
      <Toaster />
      <Sonner />
    </div>
  );
};

export default App;
