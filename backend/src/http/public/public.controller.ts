import { Controller, Get, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { LayoutQuery } from "src/@modules/empresa/layout/layout.query";

@Controller("")
export class PublicController {
  constructor(readonly layoutQuery: LayoutQuery) {}

  @Get("/ping")
  async buscarLayout(@Req() req: Request, @Res() res: Response) {
    const layout = await this.layoutQuery.buscarLayoutDominio("teste");
    return res.status(201).json({
      layout,
    });
  }
}
