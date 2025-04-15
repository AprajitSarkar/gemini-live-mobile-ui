
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

declare global {
  interface Window {
    GeminiAgent: new (config: GeminiAgentConfig) => any;
    EventEmitter: new () => any;
    ToolManager: new () => any;
  }
}

class GeminiService extends EventEmitter {
  private agent: any = null;
  private isInitialized = false;
  
  constructor() {
    super();
    // We'll initialize when requested to avoid errors if script isn't loaded yet
  }
  
  public async initialize(apiKey: string): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      if (!window.GeminiAgent) {
        console.error("GeminiAgent not found. Make sure script.js is properly loaded.");
        return false;
      }
      
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      const config = {
        model: "models/gemini-2.0-flash-exp",
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
      
      const toolManager = new window.ToolManager();
      
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
