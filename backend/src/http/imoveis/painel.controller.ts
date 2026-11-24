import { Controller, Get, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiDate } from "src/@modules/shared/apiDate";
import { ImoveisQuery } from "src/@modules/imoveis/imoveis.query";

@Controller("imoveis/painel")
export class PainelController {
  constructor(private readonly imoveisQuery: ImoveisQuery) {}

  @Get()
  async painel(@Req() req: Request | any, @Res() res: Response) {
    const data = await this.imoveisQuery.painel(req.companyUuid, ApiDate.now("YYYY-MM-DD"));
    return res.status(200).json({ success: true, data });
  }
}
