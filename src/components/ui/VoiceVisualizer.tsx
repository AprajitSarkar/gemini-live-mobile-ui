
import React from 'react';
import { cn } from '@/lib/utils';
import { VoiceVisualizerProps } from '@/types/gemini';

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isActive, 
  intensity = 0.5 
}) => {
  return (
    <div className={cn(
      "flex items-center space-x-1 h-4 transition-all duration-300",
      isActive ? "opacity-100" : "opacity-30"
    )}>
      {[1, 2, 3].map((bar) => (
        <div 
          key={bar} 
          className={cn(
            "w-1 bg-green-500 rounded-full transition-all duration-300 ease-in-out",
            isActive ? `h-${bar * 2}` : "h-1"
          )}
          style={{ 
            height: isActive ? `${bar * intensity * 8}px` : '4px' 
          }}
        />
      ))}
    </div>
  );
};
