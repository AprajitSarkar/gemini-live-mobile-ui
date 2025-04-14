
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApiKeyScreenProps } from '@/types/gemini';
import { Bot, Key } from 'lucide-react';

const ApiKeyScreen: React.FC<ApiKeyScreenProps> = ({ onValidApiKey }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleValidation = async () => {
    setIsValidating(true);
    setError('');
    
    // TODO: Replace with actual Gemini API key validation
    try {
      // Simulated validation
      if (apiKey.length > 20) {
        onValidApiKey(apiKey);
      } else {
        setError('Invalid API Key');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsValidating(false);
    }
  };

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
            {isValidating ? 'Validating...' : 'Continue'}
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
