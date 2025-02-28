// types.ts
export interface ProgressMessage {
  type: "progress";
  message: string;
  progress: number;
  error?: string | null;
}

export interface LoadModelRequest {
  command: "load_model";
  model_path: string;
  lora_path?: string;
}

export interface GenerateRequest {
  command: "generate";
  image: string;
  prompt: string;
  strength?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

export interface GenerateResponse {
  type: "result";
  image: string;
}

// websocket-client.ts
export class WebSocketClient {
  private ws: WebSocket;
  private messageHandlers: Map<string, (data: any) => void>;

  constructor(url: string = "ws://localhost:8765") {
    this.ws = new WebSocket(url);
    this.messageHandlers = new Map();

    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onerror = (error) => console.error("WebSocket error:", error);
  }

  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    }
  }

  public onProgress(callback: (message: ProgressMessage) => void) {
    this.messageHandlers.set("progress", callback);
  }

  public onResult(callback: (response: GenerateResponse) => void) {
    this.messageHandlers.set("result", callback);
  }

  public async loadModel(
    request: Omit<LoadModelRequest, "command">,
  ): Promise<void> {
    const message: LoadModelRequest = {
      command: "load_model",
      ...request,
    };
    this.ws.send(JSON.stringify(message));
  }

  public async generateImage(
    request: Omit<GenerateRequest, "command">,
  ): Promise<void> {
    const message: GenerateRequest = {
      command: "generate",
      strength: 0.6,
      guidance_scale: 2.0,
      num_inference_steps: 4,
      ...request,
    };
    this.ws.send(JSON.stringify(message));
  }
}
