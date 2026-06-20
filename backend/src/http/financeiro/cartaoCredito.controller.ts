import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { IncluirCartaoCreditoUsecase } from "src/@modules/financeiro/incluirCartaoCredito/incluirCartaoCredito.usecase";

@Controller("cartao-credito")
export class CartaoCreditoController {
  constructor(readonly incluirCartaoCreditoUsecase: IncluirCartaoCreditoUsecase) {}

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    await this.incluirCartaoCreditoUsecase.execute({
      companyUuid: req.companyUuid,
      userUuid: req.userUuid,
      cartaoCredito: {
        nomeNoCartao: body.nomeNoCartao,
        numeroCartao: body.numeroCartao,
        mesVencimento: body.mesVencimento,
        anoVencimento: body.anoVencimento,
        codigoSeguranca: body.codigoSeguranca,
      },
    });
    return res.status(201).json({ success: true });
  }
}
