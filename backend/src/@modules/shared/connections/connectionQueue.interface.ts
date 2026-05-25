export interface ConnectionQueueInterface {
  createExchange(exchangeName: string): Promise<void>;
  listExchange(): Promise<string[]>;
  listExchangeQueues(exchangeName: string): Promise<string[]>;
  createQueue(exchangeName: string, queueName: string, binding: string | null, autoDelete?: boolean): Promise<void>;
  deleteQueue(queueName: string): Promise<void>;
  listQueue(): Promise<string[]>;
  countMessageQueue(queueName: string): Promise<number>;
  existeQueue(queueName: string): Promise<boolean>;
  createConsumer(exchangeName: string, queueName: string, callback: (message: any) => Promise<void>): Promise<void>;
  deleteConsumer(queueName: string): Promise<void>;
  countMessage(queueName: string): Promise<number>;
  getMessage(queueNeme: string): Promise<any>;
  publishMessage(exchangeName: string, binding: string, message: string): Promise<void>;
  publishMessageExchange(exchangeName: string, message: string): Promise<void>;
  purgue(queueName: string);
}
