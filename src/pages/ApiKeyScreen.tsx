
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApiKeyScreenProps } from '@/types/gemini';
import { Bot, Key, Loader2 } from 'lucide-react';
import { geminiService } from '@/services/GeminiService';
import { toast } from '@/hooks/use-toast';

const ApiKeyScreen: React.FC<ApiKeyScreenProps> = ({ onValidApiKey }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a saved API key
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Small delay to ensure scripts are loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleValidation = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    
    setIsValidating(true);
    setError('');
    
    try {
      // Initialize the GeminiService with the provided API key
      const isInitialized = await geminiService.initialize(apiKey);
      
      if (isInitialized) {
        // Notify the parent component
        onValidApiKey(apiKey);
        
        toast({
          title: "API Key validated",
          description: "Your API key has been successfully validated.",
        });
      } else {
        setError('Failed to initialize Gemini service');
        toast({
          title: "Validation failed",
          description: "Could not initialize Gemini service. Please check your API key.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Error validating API key');
      toast({
        title: "Validation error",
        description: "Error occurred during validation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#10A37F] animate-spin" />
          <p className="text-white mt-4">Loading Gemini components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <Bot 
            className="text-[#10A37F] mb-4" 
            size={80} 
            strokeWidth={1.5} 
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            Enter API Key
          </h1>
          <p className="text-gray-400 text-center mb-4">
            Enter your Gemini API key to get started
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Gemini API Key" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isValidating}
              className={`
                w-full 
                ${error ? 'border-red-500' : 'border-gray-700'}
                bg-black/40 text-white 
                focus:ring-[#10A37F] focus:border-[#10A37F]
                pl-10
              `}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Key className="text-gray-500" />
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button 
            onClick={handleValidation}
            disabled={!apiKey || isValidating}
            className="
              w-full 
              bg-[#10A37F] 
              hover:bg-[#1ABF9C] 
              text-white 
              transition-transform 
              active:scale-95
            "
          >
            {isValidating ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Validating...</span>
              </div>
            ) : 'Continue'}
          </Button>

          <div className="text-center mt-4">
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#10A37F] hover:underline"
            >
              Get API Key
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyScreen;
