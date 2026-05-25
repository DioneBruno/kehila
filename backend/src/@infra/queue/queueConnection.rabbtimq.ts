import * as amqplib from "amqplib";
import axios from "axios";
import { ApiDate } from "src/@modules/shared/apiDate";
import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionQueueInterface } from "src/@modules/shared/connections/connectionQueue.interface";

const vhost = process.env.RABBITMQ_VHOST as string;
const apiUrl = process.env.RABBITMQ_API as string;
const username = process.env.RABBITMQ_API_USERNAME as string;
const password = process.env.RABBITMQ_API_PASSWORD as string;

export class QueueConnectionRabbtimq implements ConnectionQueueInterface {
  constructor(readonly channel: amqplib.Channel) {}

  async createExchange(exchangeName: string): Promise<void> {
    await this.channel.assertExchange(exchangeName, "direct");
  }
  async listExchange(): Promise<string[]> {
    const response = await axios.get(`${apiUrl}/exchanges`, {
      auth: { username, password },
    });
    return response.data.map((queue) => queue.name);
  }
  async listExchangeQueues(exchangeName: string): Promise<string[]> {
    const response = await axios.get(`${apiUrl}/exchanges/${vhost}/${exchangeName}/bindings/source`, {
      auth: { username, password },
    });
    return response.data.map((i) => i.destination);
  }

  async createQueue(exchangeName: string, queueName: string, binding: string, autoDelete: boolean = false): Promise<void> {
    const arg = {};
    if (autoDelete) {
      arg["x-expires"] = 1000 * 60 * 60 * 24; // Remove - 24 horas
    }
    await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
      arguments: arg,
    });
    await Promise.all([this.channel.bindQueue(queueName, exchangeName, binding)]);
    await this.channel.assertQueue(`${queueName}_error`, {
      durable: true,
      autoDelete,
      arguments: arg,
    });
    await Promise.all([this.channel.bindQueue(`${queueName}_error`, exchangeName, `${queueName}_error`)]);
  }

  async deleteQueue(queueName: string): Promise<void> {
    const exist = await this.existeQueue(queueName);
    if (!exist) return;
    await this.channel.deleteQueue(queueName);
  }

  async existeQueue(queueName: string): Promise<boolean> {
    const queues = await this.listQueue();
    return queues.includes(queueName);
  }

  async listQueue() {
    if (!apiUrl) throw new ApiError("URL do RabbitMQ API não informada", 400);
    const response = await axios.get(`${apiUrl}/queues`, {
      auth: { username, password },
    });
    return response.data.map((queue) => queue.name);
  }

  async countMessageQueue(queueName: string): Promise<number> {
    const response = await axios.get(`${apiUrl}/queues`, {
      auth: { username, password },
    });
    const queue = response.data.find((q) => q.name === queueName);

    if (!queue) return 0;
    return queue.message_stats?.publish ?? 0;
  }

  async createConsumer(exchangeName: string, queueName: string, callback: (message: any) => Promise<void>): Promise<void> {
    await this.channel.consume(
      queueName,
      async (message) => {
        if (!message) return;
        try {
          await callback(message);
          this.channel.ack(message);
        } catch (error) {
          try {
            const body = JSON.parse(message?.content?.toString() ?? "{}");
            const messageError = {
              errorMeta: {
                date: ApiDate.now(),
                exchangeName,
                queueName,
                message: error.message,
                stack: error.stack,
              },
              ...body,
            };
            await this.publishMessage(exchangeName, `${queueName}_error`, JSON.stringify(messageError));
          } catch (err) {
            console.error("Erro ao publicar na fila de erro:", err);
          } finally {
            this.channel.ack(message); // Sempre faz ack no final
          }
        }
      },
      {
        consumerTag: queueName,
        noAck: false, // garantir que não está omitindo isso por acidente
      },
    );
  }

  async purgue(queueName: string) {
    await this.channel.purgeQueue(queueName);
  }

  async deleteConsumer(queueName: string): Promise<void> {
    await this.channel.cancel(queueName);
  }

  async getMessage(queueNeme: any): Promise<any> {
    const message = await this.channel.get(queueNeme, { noAck: false });
    return message;
  }

  async countMessage(queueName: string): Promise<number> {
    const dash = await this.channel.checkQueue(queueName);
    return dash.messageCount;
  }

  async publishMessage(exchangeName: string, binding: string, message: string): Promise<void> {
    const body = Buffer.from(message);
    await this.channel.publish(exchangeName, binding, body);
  }

  async publishMessageExchange(exchangeName: string, message: string): Promise<void> {
    const body = Buffer.from(message);
    await this.channel.sendToQueue(exchangeName, body);
  }
}
