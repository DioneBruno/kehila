import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "src/@modules/imoveis/shared/garantirUuid";
import { AdminQuery } from "src/@modules/admin/admin.query";
import { CadastrarEmpresaUsecase } from "src/@modules/admin/cadastrarEmpresa/cadastrarEmpresa.usecase";
import { DefinirModulosEmpresaUsecase } from "src/@modules/admin/definirModulos/definirModulosEmpresa.usecase";
import { EditarEmpresaUsecase } from "src/@modules/empresa/editarEmpresa/editarEmpresa.usecase";
import { CriarDominioUsecase } from "src/@modules/empresa/dominio/criarDominio/criarDominio.usecase";
import { ListarDominiosUsecase } from "src/@modules/empresa/dominio/listarDominios/listarDominios.usecase";
import { EditarDominioUsecase } from "src/@modules/empresa/dominio/editarDominio/editarDominio.usecase";
import { DeletarDominioUsecase } from "src/@modules/empresa/dominio/deletarDominio/deletarDominio.usecase";

const EMPRESA_NAO_ENCONTRADA = "Empresa não encontrada";

@Controller("admin/empresas")
export class AdminEmpresaController {
  constructor(
    readonly adminQuery: AdminQuery,
    readonly cadastrarEmpresaUsecase: CadastrarEmpresaUsecase,
    readonly editarEmpresaUsecase: EditarEmpresaUsecase,
    readonly definirModulosUsecase: DefinirModulosEmpresaUsecase,
    readonly criarDominioUsecase: CriarDominioUsecase,
    readonly listarDominiosUsecase: ListarDominiosUsecase,
    readonly editarDominioUsecase: EditarDominioUsecase,
    readonly deletarDominioUsecase: DeletarDominioUsecase,
  ) {}

  private async garantirEmpresa(uuid: string) {
    garantirUuid(uuid, EMPRESA_NAO_ENCONTRADA);
    if (!(await this.adminQuery.existeEmpresa(uuid))) throw new ApiError(EMPRESA_NAO_ENCONTRADA, 404);
  }

  @Get()
  async listar(
    @Query("busca") busca: string,
    @Query("pagina") pagina: string,
    @Query("porPagina") porPagina: string,
    @Res() res: Response,
  ) {
    const { data, total } = await this.adminQuery.listarEmpresas({
      busca,
      pagina: Number(pagina) > 0 ? Math.floor(Number(pagina)) : 1,
      porPagina: Number(porPagina) > 0 ? Math.min(Math.floor(Number(porPagina)), 100) : 20,
    });
    return res.status(200).json({ success: true, data, meta: { total } });
  }

  @Post()
  async cadastrar(@Body() body: any, @Res() res: Response) {
    const e = body?.empresa;
    const a = body?.admin;
    const resultado = await this.cadastrarEmpresaUsecase.execute({
      empresa: e && {
        name: e.name,
        cpfCnpj: e.cpfCnpj,
        commercialName: e.commercialName,
        fantasyName: e.fantasyName,
        stateRegistration: e.stateRegistration,
        email: e.email,
        phone: e.phone,
        uf: e.uf,
        address: e.address,
      },
      dominio: body?.dominio,
      modulos: body?.modulos,
      admin: a && { name: a.name, email: a.email, cpf: a.cpf, phone: a.phone, password: a.password },
    });
    return res.status(201).json({ success: true, data: { uuid: resultado.uuid } });
  }

  @Get(":uuid")
  async detalhar(@Param("uuid") uuid: string, @Res() res: Response) {
    garantirUuid(uuid, EMPRESA_NAO_ENCONTRADA);
    const empresa = await this.adminQuery.detalharEmpresa(uuid);
    if (!empresa) throw new ApiError(EMPRESA_NAO_ENCONTRADA, 404);
    return res.status(200).json({ success: true, data: empresa });
  }

  @Put(":uuid")
  async editar(@Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.garantirEmpresa(uuid);
    await this.editarEmpresaUsecase.execute({
      companyUuid: uuid,
      name: body.name,
      commercialName: body.commercialName,
      fantasyName: body.fantasyName,
      stateRegistration: body.stateRegistration,
      cpfCnpj: body.cpfCnpj,
      email: body.email,
      phone: body.phone,
      address: body.address,
      uf: body.uf,
    });
    return res.status(200).json({ success: true });
  }

  @Get(":uuid/dominios")
  async listarDominios(@Param("uuid") uuid: string, @Res() res: Response) {
    await this.garantirEmpresa(uuid);
    const resultado = await this.listarDominiosUsecase.execute({ companyUuid: uuid });
    return res.status(200).json({ success: true, data: resultado });
  }

  @Post(":uuid/dominios")
  async criarDominio(@Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.garantirEmpresa(uuid);
    const resultado = await this.criarDominioUsecase.execute({ companyUuid: uuid, domain: body.domain, active: body.active });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Put(":uuid/dominios/:dominioUuid")
  async editarDominio(@Param("uuid") uuid: string, @Param("dominioUuid") dominioUuid: string, @Body() body: any, @Res() res: Response) {
    await this.garantirEmpresa(uuid);
    await this.editarDominioUsecase.execute({ companyUuid: uuid, dominioUuid, domain: body.domain, active: body.active });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid/dominios/:dominioUuid")
  async deletarDominio(@Param("uuid") uuid: string, @Param("dominioUuid") dominioUuid: string, @Res() res: Response) {
    await this.garantirEmpresa(uuid);
    await this.deletarDominioUsecase.execute({ companyUuid: uuid, dominioUuid });
    return res.status(200).json({ success: true });
  }

  @Put(":uuid/modulos")
  async definirModulos(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.garantirEmpresa(uuid);
    const modulos = await this.definirModulosUsecase.execute({ companyUuid: uuid, companyUuidLogada: req.companyUuid, modulos: body.modulos });
    return res.status(200).json({ success: true, data: modulos });
  }
}
