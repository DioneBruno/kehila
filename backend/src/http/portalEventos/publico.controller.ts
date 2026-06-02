import { Body, Controller, Param, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CadastrandoUsuarioUsecase } from "src/@modules/portalEventos/cadastrarUsuario/cadastrandoUsuario.usecase";
import { PortalEventosQuery } from "src/@modules/portalEventos/portalEventos.query";

@Controller("publico/eventos")
export class PublicoController {
  constructor(
    readonly portalEventosQuery: PortalEventosQuery,
    readonly cadastrandoUsuarioUsecase: CadastrandoUsuarioUsecase,
  ) {}

  @Post(":eventoUuid")
  async buscarEvento(@Req() req: Request | any, @Param("eventoUuid") eventoUuid: string, @Body() body: any, @Res() res: Response) {
    const response = await this.portalEventosQuery.buscarEvento(req.companyUuid, eventoUuid);
    return res.status(201).json(response);
  }

  @Post("novo-usuario")
  async cadastrarUsuario(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const response = await this.cadastrandoUsuarioUsecase.execute({
      companyUuid: body.companyUuid,
      cpf: body.cpf,
      nome: body.nome,
      email: body.email,
      phone: body.phone,
    });
    return res.status(201).json(response);
  }
}
