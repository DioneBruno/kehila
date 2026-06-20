import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ListaPagamentoUsecase } from "src/@modules/financeiro/listaPagamento/listaPagamento.usecase";

@Controller("pagamentos")
export class PagamentosController {
  constructor(readonly listaPagamentoUsecase: ListaPagamentoUsecase) {}

  @Get()
  async listar(@Req() req: Request | any, @Query() query: any, @Res() res: Response) {
    const resultado = await this.listaPagamentoUsecase.execute({
      companyUuid: req.companyUuid,
      busca: query.busca,
      status: query.status,
      pagina: query.pagina ? parseInt(query.pagina, 10) : 1,
      porPagina: query.porPagina ? parseInt(query.porPagina, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      data: resultado.dados,
      meta: { total: resultado.total },
    });
  }
}
