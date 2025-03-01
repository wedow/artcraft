// websocket-client.ts
import {
  ProgressMessage,
  GenerateResponse,
  LoadModelRequest,
  GenerateRequest,
} from "./DrawServerTypes";

export class WebSocketClient {
  public ws: WebSocket;
  private messageHandlers: Map<string, (data: any) => void>;
  private isConnected: boolean = false;

  constructor(url: string = "ws://localhost:8765") {
    this.ws = new WebSocket(url);
    this.messageHandlers = new Map();

    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onerror = (error) => console.error("WebSocket error:", error);
    this.ws.onopen = () => this.isConnected = true;
    this.ws.onclose = () => this.isConnected = false;
  }

  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    const handler = this.messageHandlers.get(data.type);
    console.log(data);
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

  public isServerConnected(): boolean {
    return this.isConnected && this.ws.readyState === WebSocket.OPEN;
  }
}
