export class CognitiveLoadWebSocket {
  private ws: WebSocket | null = null;

  connect(onMessage: (data: any) => void) {
    this.ws = new WebSocket('ws://localhost:8000/ws');
    this.ws.onmessage = (event) => {
      onMessage(JSON.parse(event.data));
    };
  }

  disconnect() {
    this.ws?.close();
  }
}