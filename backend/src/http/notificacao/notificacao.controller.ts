import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { EnviarSmsUsecase } from "src/@modules/notificacao/sms/enviarSms.usecase";

@Controller("notificacoes")
export class NotificacaoController {
  constructor(
    readonly enviarSmsUsecase: EnviarSmsUsecase,
    readonly enviarEmailUsecase: EnviarEmailUsecase,
  ) {}

  @Post("enviar-sms")
  async enviarSms(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    const input = {
      gateway: body.gateway,
      destinatario: body.destinatario,
      mensagem: body.mensagem,
    };
    await this.enviarSmsUsecase.execute(input);

    return res.status(200).json({
      message: "Mensagem enviada com sucesso!",
    });
  }

  @Post("enviar-email")
  async enviarEmail(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    const input = {
      gateway: body.gateway,
      destinatario: body.destinatario,
      titulo: body.titulo,
      mensagem: body.mensagem,
    };
    await this.enviarEmailUsecase.execute(input);

    return res.status(200).json({
      message: "Mensagem enviada com sucesso!",
    });
  }
}
