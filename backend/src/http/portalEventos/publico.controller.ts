import { Body, Controller, Param, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { PortalEventosQuery } from "src/@modules/portalEventos/portalEventos.query";

@Controller("publico/eventos")
export class PublicoController {
  constructor(readonly portalEventosQuery: PortalEventosQuery) {}

  @Post(":eventoUuid")
  async buscarEvento(@Req() req: Request | any, @Param("eventoUuid") eventoUuid: string, @Body() body: any, @Res() res: Response) {
    const response = await this.portalEventosQuery.buscarEvento(req.companyUuid, eventoUuid);
    return res.status(201).json(response);
  }
}
