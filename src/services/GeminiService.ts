
import { EventEmitter } from '../utils/eventEmitter';

// Interface with the global GeminiAgent class from script.js
interface GeminiAgentConfig {
  name?: string;
  url: string;
  config: any;
  toolManager?: any;
  transcribeModelsSpeech?: boolean;
  transcribeUsersSpeech?: boolean;
  modelSampleRate?: number;
}

// Extend the global Window interface
declare global {
  interface Window {
    GeminiAgent: new (config: GeminiAgentConfig) => any;
    ToolManager: new () => any;
    EventEmitter: any; // Add this to prevent conflicts
  }
}

class GeminiService extends EventEmitter {
  private agent: any = null;
  private isInitialized = false;
  private scriptLoaded = false;
  private scriptLoadAttempts = 0;
  private readonly MAX_LOAD_ATTEMPTS = 5;
  
  constructor() {
    super();
  }
  
  private checkScriptLoaded(): boolean {
    this.scriptLoaded = typeof window !== 'undefined' && !!window.GeminiAgent;
    if (this.scriptLoaded) {
      console.log("GeminiAgent is available in the global scope");
    } else {
      console.log("GeminiAgent is not yet available in the global scope");
    }
    return this.scriptLoaded;
  }
  
  private loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.checkScriptLoaded()) {
        resolve(true);
        return;
      }
      
      // Increment attempt counter
      this.scriptLoadAttempts++;
      
      if (this.scriptLoadAttempts > this.MAX_LOAD_ATTEMPTS) {
        console.error(`Failed to load script.js after ${this.MAX_LOAD_ATTEMPTS} attempts`);
        resolve(false);
        return;
      }
      
      console.log(`Attempting to load script.js (attempt ${this.scriptLoadAttempts})`);
      
      // Remove any existing script to avoid conflicts
      const existingScript = document.querySelector('script[src="/src/script.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = '/src/script.js';
      script.async = true;
      
      script.onload = () => {
        console.log("script.js loaded successfully");
        
        // Ensure the API key is set in localStorage before checking
        const apiKey = localStorage.getItem('apiKey');
        if (!apiKey) {
          console.error("No API key found in localStorage after script load");
          resolve(false);
          return;
        }
        
        // Wait a bit for the script to initialize
        setTimeout(() => {
          this.scriptLoaded = this.checkScriptLoaded();
          resolve(this.scriptLoaded);
        }, 1000); // Increased timeout for better initialization
      };
      
      script.onerror = () => {
        console.error("Failed to load script.js");
        resolve(false);
      };
      
      // Add to document
      document.head.appendChild(script);
    });
  }
  
  public async initialize(apiKey: string): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      // Save API key to localStorage so script.js can access it
      if (apiKey) {
        localStorage.setItem('apiKey', apiKey);
        console.log("API key saved to localStorage in GeminiService");
      } else {
        console.error("No API key provided");
        return false;
      }
      
      // Make sure script is loaded
      if (!this.scriptLoaded) {
        const loaded = await this.loadScript();
        if (!loaded) {
          console.error("Could not load script.js");
          return false;
        }
      }
      
      if (!window.GeminiAgent) {
        console.error("GeminiAgent not found. Make sure script.js is properly loaded.");
        return false;
      }
      
      // Updated WebSocket URL based on user input
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      const config = {
        // Updated model name based on user input
        model: "models/gemini-2.0-flash-live-001",
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
          responseModalities: "text_and_audio"
        },
        tools: [],
        systemInstruction: {
          parts: [
            {
              text: "You are Gemini, a helpful AI assistant. Be concise and friendly."
            }
          ]
        }
      };
      
      // This might be null if script didn't load properly
      if (!window.ToolManager) {
        console.error("ToolManager not found. Continuing without tools.");
      }
      
      const toolManager = window.ToolManager ? new window.ToolManager() : null;
      
      this.agent = new window.GeminiAgent({
        url,
        config,
        toolManager,
        transcribeModelsSpeech: true,
        transcribeUsersSpeech: true,
        modelSampleRate: 24000
      });
      
      // Set up event listeners
      this.agent.on('audio', () => {
        this.emit('speaking', { intensity: Math.random() * 0.8 + 0.2 });
      });
      
      this.agent.on('interrupted', () => {
        this.emit('interrupted');
      });
      
      this.agent.on('turn_complete', () => {
        this.emit('turn_complete');
      });
      
      this.agent.on('text_sent', (text: string) => {
        this.emit('text_sent', text);
      });
      
      this.agent.on('content', (content: any) => {
        let responseText = '';
        
        if (content.modelTurn && content.modelTurn.parts) {
          const textParts = content.modelTurn.parts.filter((p: any) => p.text);
          responseText = textParts.map((p: any) => p.text).join('');
        }
        
        if (responseText) {
          this.emit('response', responseText);
        }
      });
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing Gemini agent:", error);
      return false;
    }
  }
  
  public async connect(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("GeminiService not initialized. Call initialize() first.");
    }
    
    try {
      await this.agent.connect();
      this.emit('connected');
    } catch (error) {
      console.error("Error connecting to Gemini:", error);
      this.emit('connection_error', error);
      throw error;
    }
  }
  
  public async disconnect(): Promise<void> {
    if (this.agent) {
      await this.agent.disconnect();
      this.emit('disconnected');
    }
  }
  
  public async sendText(text: string): Promise<void> {
    if (!this.agent) return;
    
    try {
      await this.agent.sendText(text);
    } catch (error) {
      console.error("Error sending text to Gemini:", error);
      this.emit('error', error);
    }
  }
  
  public toggleMic(): void {
    if (!this.agent || !this.agent.audioRecorder) return;
    
    try {
      if (this.agent.audioRecorder.isRecording) {
        this.agent.audioRecorder.stop();
        this.emit('mic_off');
      } else {
        this.agent.audioRecorder.start();
        this.emit('mic_on');
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
      this.emit('error', error);
    }
  }
  
  public toggleCamera(enable: boolean): void {
    if (!this.agent) return;
    
    try {
      if (enable) {
        this.agent.startCameraCapture();
        this.emit('camera_on');
      } else {
        this.agent.stopCameraCapture();
        this.emit('camera_off');
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      this.emit('error', error);
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
