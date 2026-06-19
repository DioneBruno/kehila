import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CadastrandoUsuarioUsecase } from "src/@modules/portalEventos/cadastrarUsuario/cadastrandoUsuario.usecase";
import { PortalEventosQuery } from "src/@modules/portalEventos/portalEventos.query";

@Controller("publico/eventos")
export class PublicoController {
  constructor(
    readonly portalEventosQuery: PortalEventosQuery,
    readonly cadastrandoUsuarioUsecase: CadastrandoUsuarioUsecase,
  ) {}

  @Post("novo-usuario")
  async cadastrarUsuario(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      cpf: body.cpf,
      name: body.name,
      email: body.email,
      phone: body.phone,
    };
    const response = await this.cadastrandoUsuarioUsecase.execute(input);
    return res.status(201).json(response);
  }

  @Post(":eventoUuid")
  async buscarEvento(@Req() req: Request | any, @Param("eventoUuid") eventoUuid: string, @Body() body: any, @Res() res: Response) {
    const response = await this.portalEventosQuery.buscarEvento(req.companyUuid, eventoUuid);
    return res.status(201).json(response);
  }

  @Post(":eventoUuid/inscritos")
  async listaPublicaInscritos(@Param("eventoUuid") eventoUuid: string, @Body() body: any, @Res() res: Response) {
    const filtro = body.filtro;
    const pagina = body.pagina ? parseInt(body.pagina, 10) : 1;
    const resultado = await this.portalEventosQuery.listaPublicaInscritos(eventoUuid, filtro, pagina);
    return res.status(200).json({
      success: true,
      data: resultado.dados,
      meta: { total: resultado.total, pagina: resultado.pagina, porPagina: resultado.porPagina },
    });
  }

  @Post(":eventoUuid/inscritos/cidade")
  async listaPublicaCidade(@Param("eventoUuid") eventoUuid: string, @Res() res: Response) {
    const resultado = await this.portalEventosQuery.listaPublicaCidade(eventoUuid);
    return res.status(200).json({ success: true, data: resultado });
  }

  @Post(":eventoUuid/inscritos/uf")
  async listaPublicaUf(@Param("eventoUuid") eventoUuid: string, @Res() res: Response) {
    const resultado = await this.portalEventosQuery.listaPublicaUf(eventoUuid);
    return res.status(200).json({ success: true, data: resultado });
  }

  @Post(":eventoUuid/inscritos/distrito")
  async listaPublicaDistrito(@Param("eventoUuid") eventoUuid: string, @Res() res: Response) {
    const resultado = await this.portalEventosQuery.listaPublicaDistrito(eventoUuid);
    return res.status(200).json({ success: true, data: resultado });
  }
}
