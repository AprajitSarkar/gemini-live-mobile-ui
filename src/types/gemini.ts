
export interface ApiKeyScreenProps {
  onValidApiKey: (apiKey: string) => void;
}

export interface ConversationState {
  isConnected: boolean;
  isRecording: boolean;
  isPaused: boolean;
  conversationDuration: number;
  aiResponse: string;
}

export interface VideoState {
  isCameraOn: boolean;
  currentCamera: 'front' | 'back';
}

export interface VoiceVisualizerProps {
  isActive: boolean;
  intensity?: number;
}

export interface SettingsState {
  showSettings: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  autoPlayEnabled: boolean;
}
