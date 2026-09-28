import { Controller, Get, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { LayoutQuery } from "src/@modules/empresa/layout/layout.query";

@Controller("")
export class PublicController {
  constructor(readonly layoutQuery: LayoutQuery) {}

  @Get("/ping")
  async ping(@Req() req: Request, @Res() res: Response) {
    const companyUuid = req["companyUuid"];
    const layout = await this.layoutQuery.buscarLayoutCompanyUuid(companyUuid);
    return res.status(201).json({
      layout,
    });
  }
}
