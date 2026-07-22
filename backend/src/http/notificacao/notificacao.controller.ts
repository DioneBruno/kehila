import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { NotificacaoGateway } from "src/@modules/notificacao/notificacaoGateway";
import { EnviarSmsUsecase } from "src/@modules/notificacao/sms/enviarSms.usecase";

@Controller("notificacoes")
export class NotificacaoController {
  constructor(
    readonly notificacaoGateway: NotificacaoGateway,
    readonly enviarSmsUsecase: EnviarSmsUsecase,
    readonly enviarEmailUsecase: EnviarEmailUsecase,
  ) {}

  @Post("salvar-gateway")
  async salvarGateway(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const gateway = {
      ...body,
    };
    await this.notificacaoGateway.salvarGateway(req.companyUuid, gateway);
    return res.status(200).json({
      message: "Gateway salvo com sucesso!",
    });
  }

  @Get("listar-gateways")
  async listarGateways(@Req() req: Request | any, @Res() res: Response) {
    const gatewaysModel = await this.notificacaoGateway.listarGateways(req.companyUuid);
    return res.status(200).json({
      data: gatewaysModel,
    });
  }

  @Post("enviar-sms")
  async enviarSms(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
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
  async enviarEmail(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
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
