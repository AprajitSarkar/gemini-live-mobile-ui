/**
 * Consolidated script that combines functionality from multiple modules
 * in the Gemini 2 Live API Demo.
 */

/**
 * SECTION 1: UTILITIES
 * Core utility functions used across the application.
 */

/**
 * Converts a Blob object to a JSON object using FileReader.
 * @param {Blob} blob - The Blob object to convert
 * @returns {Promise<Object>} Promise resolving to parsed JSON object
 */
function blobToJSON(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            if (reader.result) {
                resolve(JSON.parse(reader.result));
            } else {
                reject('Failed to parse blob to JSON');
            }
        };
        
        reader.readAsText(blob);
    });
}

/**
 * Converts a base64 encoded string to an ArrayBuffer.
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} ArrayBuffer containing the decoded data
 */
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
}

/**
 * Converts an ArrayBuffer to a base64 encoded string.
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
 * @returns {string} Base64 encoded string representation of the buffer
 */
function arrayBufferToBase64(buffer) {
    try {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('Failed to convert array buffer to base64: ' + error.message);
    }
}

/**
 * Simple EventEmitter implementation for handling events.
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
    }
    
    off(event, listener) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
    }
    
    emit(event, ...args) {
        if (!this.events[event]) return false;
        this.events[event].forEach(listener => listener(...args));
        return true;
    }
    
    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        return this.on(event, onceWrapper);
    }
}

/**
 * SECTION 2: AUDIO VISUALIZATION
 * Creates waveform visualization for audio streams.
 */
class AudioVisualizer {
    constructor(audioContext, canvasId) {
        this.audioContext = audioContext;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Set up audio nodes
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.85;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.prevDataArray = new Uint8Array(this.bufferLength);
        
        // Visualization settings
        this.gradientColors = ['#4CAF50', '#81C784', '#A5D6A7'];
        this.lineWidth = 4;
        this.padding = 40;
        this.smoothingFactor = 0.4;
        
        // Animation
        this.isAnimating = false;
        this.animationId = null;
        
        // Bind methods
        this.draw = this.draw.bind(this);
        this.resize = this.resize.bind(this);
        
        // Initial setup
        this.resize();
        window.addEventListener('resize', this.resize);
        this.createGradient();
    }
    
    connectSource(sourceNode) {
        sourceNode.connect(this.analyser);
    }
    
    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.draw();
        }
    }
    
    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    createGradient() {
        this.gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        this.gradientColors.forEach((color, index) => {
            this.gradient.addColorStop(index / (this.gradientColors.length - 1), color);
        });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        this.createGradient();
    }
    
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }
    
    draw() {
        if (!this.isAnimating) return;
        
        this.prevDataArray.set(this.dataArray);
        this.analyser.getByteTimeDomainData(this.dataArray);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.gradient;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const width = this.canvas.width - (this.padding * 2);
        const height = this.canvas.height - (this.padding * 2);
        const centerY = this.canvas.height / 2;
        
        const sliceWidth = width / (this.bufferLength - 1);
        let x = this.padding;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, centerY);
        
        for (let i = 0; i < this.bufferLength; i++) {
            const currentValue = this.dataArray[i] / 128.0;
            const prevValue = this.prevDataArray[i] / 128.0;
            const v = this.lerp(prevValue, currentValue, this.smoothingFactor);
            
            const y = (v * height / 2) + centerY;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                const prevX = x - sliceWidth;
                const prevY = (this.lerp(this.prevDataArray[i-1]/128.0, this.dataArray[i-1]/128.0, this.smoothingFactor) * height / 2) + centerY;
                const cpX = (prevX + x) / 2;
                this.ctx.quadraticCurveTo(cpX, prevY, x, y);
            }
            
            x += sliceWidth;
        }
        
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.gradientColors[0];
        
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        
        this.animationId = requestAnimationFrame(this.draw);
    }
    
    cleanup() {
        this.stop();
        window.removeEventListener('resize', this.resize);
        if (this.analyser) {
            this.analyser.disconnect();
        }
    }
}

/**
 * SECTION 3: WEBSOCKET CLIENT
 * Client for interacting with the Gemini API via WebSockets.
 */
class GeminiWebsocketClient extends EventEmitter {
    constructor(name, url, config) {
        super();
        this.name = name || 'WebSocketClient';
        this.url = url;
        this.ws = null;
        this.config = config;
        this.isConnecting = false;
        this.connectionPromise = null;
    }

    async connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return this.connectionPromise;
        }

        if (this.isConnecting) {
            return this.connectionPromise;
        }

        console.info('🔗 Establishing WebSocket connection...');
        this.isConnecting = true;
        this.connectionPromise = new Promise((resolve, reject) => {
            const ws = new WebSocket(this.url);

            ws.addEventListener('open', () => {
                console.info('🔗 Successfully connected to websocket');
                this.ws = ws;
                this.isConnecting = false;

                this.sendJSON({ setup: this.config });
                resolve();
            });

            ws.addEventListener('error', (error) => {
                this.disconnect(ws);
                const reason = error.reason || 'Unknown';
                const message = `Could not connect to "${this.url}. Reason: ${reason}"`;
                console.error(message, error);
                reject(error);
            });

            ws.addEventListener('message', async (event) => {
                if (event.data instanceof Blob) {
                    this.receive(event.data);
                } else {
                    console.error('Non-blob message received', event);
                }
            });
        });

        return this.connectionPromise;
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnecting = false;
            this.connectionPromise = null;
            console.info(`${this.name} successfully disconnected from websocket`);
        }
    }

    async receive(blob) {
        const response = await blobToJSON(blob);
        
        if (response.toolCall) {
            console.debug(`${this.name} received tool call`, response);       
            this.emit('tool_call', response.toolCall);
            return;
        }

        if (response.toolCallCancellation) {
            console.debug(`${this.name} received tool call cancellation`, response);
            this.emit('tool_call_cancellation', response.toolCallCancellation);
            return;
        }

        if (response.serverContent) {
            const { serverContent } = response;
            if (serverContent.interrupted) {
                console.debug(`${this.name} is interrupted`);
                this.emit('interrupted');
                return;
            }
            if (serverContent.turnComplete) {
                console.debug(`${this.name} has completed its turn`);
                this.emit('turn_complete');
            }
            if (serverContent.modelTurn) {
                let parts = serverContent.modelTurn.parts;

                const audioParts = parts.filter((p) => p.inlineData && p.inlineData.mimeType.startsWith('audio/pcm'));
                const base64s = audioParts.map((p) => p.inlineData?.data);
                const otherParts = parts.filter((p) => !audioParts.includes(p));

                base64s.forEach((b64) => {
                    if (b64) {
                        const data = base64ToArrayBuffer(b64);
                        this.emit('audio', data);
                    }
                });

                if (otherParts.length) {
                    this.emit('content', { modelTurn: { parts: otherParts } });
                }
            }
        } else {
            console.debug(`${this.name} received unmatched message:`, response);
        }
    }

    async sendAudio(base64audio) {
        const data = { realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm', data: base64audio }] } };
        await this.sendJSON(data);
    }

    async sendImage(base64image) {
        const data = { realtimeInput: { mediaChunks: [{ mimeType: 'image/jpeg', data: base64image }] } };
        await this.sendJSON(data);
    }

    async sendText(text, endOfTurn = true) {
        const formattedText = { 
            clientContent: { 
                turns: [{
                    role: 'user', 
                    parts: { text: text }
                }], 
                turnComplete: endOfTurn 
            } 
        };
        await this.sendJSON(formattedText);
    }

    async sendToolResponse(toolResponse) {
        if (!toolResponse || !toolResponse.id) {
            throw new Error('Tool response must include an id');
        }

        const { output, id, error } = toolResponse;
        let result = [];

        if (error) {
            result = [{
                response: { error: error },
                id
            }];
        } else if (output === undefined) {
            throw new Error('Tool response must include an output when no error is provided');
        } else {
            result = [{
                response: { output: output },
                id
            }];
        }

        await this.sendJSON({ toolResponse: {functionResponses: result} });
    }

    async sendJSON(json) {        
        try {
            this.ws.send(JSON.stringify(json));
        } catch (error) {
            throw new Error(`Failed to send ${json} to ${this.name}:` + error);
        }
    }
}

/**
 * SECTION 4: AGENT
 * Core application class that orchestrates interactions.
 */
class GeminiAgent extends EventEmitter {
    constructor({
        name = 'GeminiAgent',
        url,
        config,
        deepgramApiKey = null,
        transcribeModelsSpeech = true,
        transcribeUsersSpeech = false,
        modelSampleRate = 24000,
        toolManager = null
    } = {}) {
        super();
        if (!url) throw new Error('WebSocket URL is required');
        if (!config) throw new Error('Config is required');

        this.initialized = false;
        this.connected = false;

        // For audio components
        this.audioContext = null;
        this.audioRecorder = null;
        this.audioStreamer = null;
        
        // For transcribers
        this.transcribeModelsSpeech = transcribeModelsSpeech;
        this.transcribeUsersSpeech = transcribeUsersSpeech;
        this.deepgramApiKey = deepgramApiKey;
        this.modelSampleRate = modelSampleRate;

        // Camera and screen sharing settings
        this.fps = localStorage.getItem('fps') || '5';
        this.captureInterval = 1000 / this.fps;
        this.resizeWidth = localStorage.getItem('resizeWidth') || '640';
        this.quality = localStorage.getItem('quality') || '0.4';
        
        // Add function declarations to config
        this.toolManager = toolManager;
        if (toolManager && config.tools) {
            config.tools.functionDeclarations = toolManager.getToolDeclarations() || [];
        }
        
        this.config = config;
        this.name = name;
        this.url = url;
        this.client = null;
        
        this.events = {};
    }

    setupEventListeners() {
        // Handle incoming audio data from the model
        this.client.on('audio', async (data) => {
            try {
                if (!this.audioStreamer.isInitialized) {
                    this.audioStreamer.initialize();
                }
                this.audioStreamer.streamAudio(new Uint8Array(data));
            } catch (error) {
                throw new Error('Audio processing error:' + error);
            }
        });

        // Handle model interruptions
        this.client.on('interrupted', () => {
            this.audioStreamer.stop();
            this.audioStreamer.isInitialized = false;
            this.emit('interrupted');
        });

        // Handle turn completion
        this.client.on('turn_complete', () => {
            console.info('Model finished speaking');
            this.emit('turn_complete');
        });

        // Handle tool calls
        this.client.on('tool_call', async (toolCall) => {
            await this.handleToolCall(toolCall);
        });
    }
        
    async handleToolCall(toolCall) {
        const functionCall = toolCall.functionCalls[0];
        const response = await this.toolManager.handleToolCall(functionCall);
        await this.client.sendToolResponse(response);
    }

    async connect() {
        this.client = new GeminiWebsocketClient(this.name, this.url, this.config);
        await this.client.connect();
        this.setupEventListeners();
        this.connected = true;
    }

    async sendText(text) {
        await this.client.sendText(text);
        this.emit('text_sent', text);
    }

    async startCameraCapture() {
        if (!this.connected) {
            throw new Error('Must be connected to start camera capture');
        }

        try {
            // Implementation would initialize camera and set interval
            // to capture and send images
            console.info('Camera capture started');
        } catch (error) {
            await this.disconnect();
            throw new Error('Failed to start camera capture: ' + error);
        }
    }

    async stopCameraCapture() {
        // Implementation would clear intervals and dispose of camera resources
        console.info('Camera capture stopped');
    }

    async startScreenShare() {
        if (!this.connected) {
            throw new Error('Websocket must be connected to start screen sharing');
        }

        try {
            // Implementation would initialize screen capture and set interval
            // to capture and send screenshots
            console.info('Screen sharing started');
        } catch (error) {
            await this.stopScreenShare();
            throw new Error('Failed to start screen sharing: ' + error);
        }
    }

    async stopScreenShare() {
        // Implementation would clear intervals and dispose of screen resources
        console.info('Screen sharing stopped');
    }

    async disconnect() {
        try {
            await this.stopCameraCapture();
            await this.stopScreenShare();
            
            // Clean up audio resources
            if (this.audioRecorder) {
                this.audioRecorder.stop();
                this.audioRecorder = null;
            }

            if (this.visualizer) {
                this.visualizer.cleanup();
                this.visualizer = null;
            }
            
            if (this.audioStreamer) {
                this.audioStreamer.stop();
                this.audioStreamer = null;
            }
            
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            // Close websocket connection
            if (this.client) {
                this.client.disconnect();
                this.client = null;
            }
            
            this.connected = false;
            
            console.info('Disconnected and cleaned up resources');
        } catch (error) {
            console.error('Error during disconnect:', error);
        }
    }
}

/**
 * SECTION 5: TOOL MANAGER
 * Manages function tools for the Gemini API.
 */
class ToolManager {
    constructor() {
        this.tools = {};
    }
    
    registerTool(name, toolInstance) {
        this.tools[name] = toolInstance;
    }
    
    getToolDeclarations() {
        return Object.values(this.tools).map(tool => tool.getDeclaration());
    }
    
    async handleToolCall(functionCall) {
        const { name, id, args } = functionCall;
        
        if (!this.tools[name]) {
            return {
                id,
                error: `Tool '${name}' not found`
            };
        }
        
        try {
            const output = await this.tools[name].execute(args);
            return {
                id,
                output
            };
        } catch (error) {
            return {
                id,
                error: error.message || String(error)
            };
        }
    }
}

/**
 * SECTION 6: CHAT MANAGER
 * Manages the chat UI elements.
 */
class ChatManager {
    constructor() {
        this.messagesContainer = document.getElementById('messages');
        this.streamingContainer = document.getElementById('streaming-message');
        this.lastUserMessageType = null;
    }
    
    addUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message';
        messageEl.textContent = text;
        this.messagesContainer.appendChild(messageEl);
        this.lastUserMessageType = 'text';
        this.scrollToBottom();
    }
    
    addUserAudioMessage() {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message audio-message';
        messageEl.innerHTML = '<i class="fas fa-microphone"></i> Audio message';
        this.messagesContainer.appendChild(messageEl);
        this.lastUserMessageType = 'audio';
        this.scrollToBottom();
    }
    
    addBotMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message bot-message';
        messageEl.textContent = text;
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    updateStreamingMessage(text) {
        if (this.streamingContainer) {
            this.streamingContainer.textContent = text;
            this.streamingContainer.style.display = text ? 'block' : 'none';
            this.scrollToBottom();
        }
    }
    
    finalizeStreamingMessage() {
        const text = this.streamingContainer?.textContent;
        if (text) {
            this.addBotMessage(text);
            this.updateStreamingMessage('');
        }
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

/**
 * SECTION 7: SETUP AND INITIALIZATION
 * Main application initialization code.
 */
function getConfig() {
    return {
        model: "models/gemini-2.0-flash-live-001",
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
            responseModalities: "text_and_audio"
        },
        tools: [
            {
                googleSearch: {}
            }
        ],
        systemInstruction: {
            parts: [
                {
                    text: "You are Gemini, a helpful AI assistant. Be concise and friendly."
                }
            ]
        }
    };
}

function getWebsocketUrl() {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        throw new Error('API key not found. Please set your API key in settings.');
    }
    return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
}

function init() {
    const url = getWebsocketUrl();
    const config = getConfig();
    
    const toolManager = new ToolManager();
    // Register tools as needed
    
    const chatManager = new ChatManager();
    
    const geminiAgent = new GeminiAgent({
        url,
        config,
        toolManager
    });
    
    // Handle chat-related events
    geminiAgent.on('transcription', (transcript) => {
        chatManager.updateStreamingMessage(transcript);
    });
    
    geminiAgent.on('text_sent', (text) => {
        chatManager.finalizeStreamingMessage();
        chatManager.addUserMessage(text);
    });
    
    geminiAgent.on('interrupted', () => {
        chatManager.finalizeStreamingMessage();
        if (!chatManager.lastUserMessageType) {
            chatManager.addUserAudioMessage();
        }
    });
    
    geminiAgent.on('turn_complete', () => {
        chatManager.finalizeStreamingMessage();
    });
    
    geminiAgent.connect();
    
    setupEventListeners(geminiAgent);
    
    return geminiAgent;
}

function setupEventListeners(agent) {
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    const micButton = document.getElementById('mic-button');
    const cameraButton = document.getElementById('camera-button');
    const screenButton = document.getElementById('screen-button');
    
    // Send text message
    sendButton.addEventListener('click', async () => {
        const text = messageInput.value.trim();
        if (text) {
            await agent.sendText(text);
            messageInput.value = '';
        }
    });
    
    // Handle Enter key in input
    messageInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });
    
    // Toggle microphone
    micButton.addEventListener('click', async () => {
        await agent.toggleMic();
        micButton.classList.toggle('active');
    });
    
    // Toggle camera
    cameraButton.addEventListener('click', async () => {
        if (cameraButton.classList.contains('active')) {
            await agent.stopCameraCapture();
        } else {
            await agent.startCameraCapture();
        }
        cameraButton.classList.toggle('active');
    });
    
    // Toggle screen sharing
    screenButton.addEventListener('click', async () => {
        if (screenButton.classList.contains('active')) {
            await agent.stopScreenShare();
        } else {
            await agent.startScreenShare();
        }
        screenButton.classList.toggle('active');
    });
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
