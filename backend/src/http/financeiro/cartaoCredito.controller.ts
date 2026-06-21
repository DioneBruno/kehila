import { Body, Controller, Delete, Param, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { FinanceiroQuery } from "src/@modules/financeiro/financeiro.query";
import { IncluirCartaoCreditoUsecase } from "src/@modules/financeiro/incluirCartaoCredito/incluirCartaoCredito.usecase";

@Controller("cartao-credito")
export class CartaoCreditoController {
  constructor(
    readonly financeiroQuery: FinanceiroQuery,
    readonly incluirCartaoCreditoUsecase: IncluirCartaoCreditoUsecase,
  ) {}

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      userUuid: req.userUuid,
      cartaoCredito: {
        nomeNoCartao: body.nomeNoCartao,
        numeroCartao: body.numeroCartao,
        mesVencimento: body.mesVencimento,
        anoVencimento: body.anoVencimento,
        codigoSeguranca: body.codigoSeguranca,
      },
    };
    await this.incluirCartaoCreditoUsecase.execute(input);
    return res.status(201).json({ success: true });
  }

  @Delete(":cartaoUuid")
  async remover(@Req() req: Request | any, @Res() res: Response, @Param("cartaoUuid") cartaoUuid: string) {
    await this.financeiroQuery.removerCartaoCredito(cartaoUuid);
    return res.status(201).json({ success: true });
  }
}
