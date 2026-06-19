import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CriarUsuarioUsecase } from "src/@modules/usuario/criarUsuario/criarUsuario.usecase";
import { ListarUsuariosUsecase } from "src/@modules/usuario/listarUsuarios/listarUsuarios.usecase";
import { DetalharUsuarioUsecase } from "src/@modules/usuario/detalharUsuario/detalharUsuario.usecase";
import { EditarUsuarioUsecase } from "src/@modules/usuario/editarUsuario/editarUsuario.usecase";
import { DeletarUsuarioUsecase } from "src/@modules/usuario/deletarUsuario/deletarUsuario.usecase";

@Controller("usuarios")
export class UsuarioController {
  constructor(
    readonly criarUsuarioUsecase: CriarUsuarioUsecase,
    readonly listarUsuariosUsecase: ListarUsuariosUsecase,
    readonly detalharUsuarioUsecase: DetalharUsuarioUsecase,
    readonly editarUsuarioUsecase: EditarUsuarioUsecase,
    readonly deletarUsuarioUsecase: DeletarUsuarioUsecase,
  ) {}

  @Post()
  async criar(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.criarUsuarioUsecase.execute({
      companyUuid: req.companyUuid,
      name: body.name,
      cpf: body.cpf,
      email: body.email,
      phone: body.phone,
      password: body.password,
      position: body.position,
      roles: body.roles,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Get()
  async listar(@Req() req: Request | any, @Query() query: any, @Res() res: Response) {
    const resultado = await this.listarUsuariosUsecase.execute({
      companyUuid: req.companyUuid,
      busca: query.busca,
      pagina: query.pagina ? parseInt(query.pagina, 10) : 1,
      porPagina: query.porPagina ? parseInt(query.porPagina, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      data: resultado.dados,
      meta: { total: resultado.total },
    });
  }

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const resultado = await this.detalharUsuarioUsecase.execute({
      companyUuid: req.companyUuid,
      usuarioUuid: uuid,
    });
    return res.status(200).json({ success: true, data: resultado });
  }

  @Put(":uuid")
  async editar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.editarUsuarioUsecase.execute({
      companyUuid: req.companyUuid,
      usuarioUuid: uuid,
      name: body.name,
      cpf: body.cpf,
      email: body.email,
      phone: body.phone,
      password: body.password,
      position: body.position,
      roles: body.roles,
      isAccepted: body.isAccepted,
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async deletar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.deletarUsuarioUsecase.execute({
      companyUuid: req.companyUuid,
      usuarioUuid: uuid,
      usuarioLogadoUuid: req.userUuid,
    });
    return res.status(200).json({ success: true });
  }
}
