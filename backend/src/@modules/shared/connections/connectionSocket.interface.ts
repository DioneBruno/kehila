export interface SocketConnectionInterface {
  send(eventName: string, message: any): Promise<void>;
}
