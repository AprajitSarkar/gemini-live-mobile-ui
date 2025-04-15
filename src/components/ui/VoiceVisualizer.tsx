
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { VoiceVisualizerProps } from '@/types/gemini';

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isActive, 
  intensity = 0.5 
}) => {
  const [bars, setBars] = useState([0.4, 0.6, 0.5]);
  
  // Animate the bars when active
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setBars(prev => 
        prev.map(() => 
          // Create a smooth, random animation effect
          Math.min(0.9, Math.max(0.2, intensity * (Math.random() * 0.5 + 0.7)))
        )
      );
    }, 250);
    
    return () => clearInterval(interval);
  }, [isActive, intensity]);
  
  return (
    <div className={cn(
      "flex items-center space-x-1 h-4 transition-all duration-300",
      isActive ? "opacity-100" : "opacity-30"
    )}>
      {bars.map((height, index) => (
        <div 
          key={index} 
          className="w-1 bg-green-500 rounded-full transition-all duration-300 ease-in-out"
          style={{ 
            height: isActive ? `${Math.round(height * 16)}px` : '4px',
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};
