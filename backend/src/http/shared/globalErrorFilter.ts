import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
//
@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  async catch(error: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (error instanceof ApiError) {
      const statusCode = error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        statusCode,
        message: error.message,
        internalMessage: error.internalMessage,
        data: error.data,
      });
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      const body = error.getResponse();
      return response.status(status).json(typeof body === "object" ? body : { statusCode: status, message: body });
    }

    console.error(error.stack);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Erro interno no servidor.",
    });
  }
}
