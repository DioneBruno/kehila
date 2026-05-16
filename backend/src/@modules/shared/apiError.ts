export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly internalMessage: string;
  public readonly data: any;
  constructor(message: string, statusCode?: number, internalMessage?: string, data?: any) {
    super(message);
    this.statusCode = statusCode ?? 400;
    this.internalMessage = internalMessage as string;
    this.data = data;
  }
}
