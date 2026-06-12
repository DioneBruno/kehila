import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CriarContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/criarContaBancaria/criarContaBancaria.usecase";
import { ListarContasBancariasUsecase } from "src/@modules/financeiro/contaBancaria/listarContasBancarias/listarContasBancarias.usecase";
import { DetalharContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/detalharContaBancaria/detalharContaBancaria.usecase";
import { EditarContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/editarContaBancaria/editarContaBancaria.usecase";
import { DeletarContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/deletarContaBancaria/deletarContaBancaria.usecase";

@Controller("contas-bancarias")
export class ContasBancariasController {
  constructor(
    readonly criarContaBancariaUsecase: CriarContaBancariaUsecase,
    readonly listarContasBancariasUsecase: ListarContasBancariasUsecase,
    readonly detalharContaBancariaUsecase: DetalharContaBancariaUsecase,
    readonly editarContaBancariaUsecase: EditarContaBancariaUsecase,
    readonly deletarContaBancariaUsecase: DeletarContaBancariaUsecase,
  ) {}

  @Post()
  async criar(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.criarContaBancariaUsecase.execute({
      companyUuid: req.companyUuid,
      nome: body.nome,
      bancoNumero: body.bancoNumero,
      agencia: body.agencia,
      conta: body.conta,
      digito: body.digito,
      chaveApi: body.chaveApi,
      status: body.status,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Get()
  async listar(@Req() req: Request | any, @Query() query: any, @Res() res: Response) {
    const resultado = await this.listarContasBancariasUsecase.execute({
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

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const resultado = await this.detalharContaBancariaUsecase.execute({
      companyUuid: req.companyUuid,
      contaBancariaUuid: uuid,
    });
    return res.status(200).json({ success: true, data: resultado });
  }

  @Put(":uuid")
  async editar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.editarContaBancariaUsecase.execute({
      companyUuid: req.companyUuid,
      contaBancariaUuid: uuid,
      nome: body.nome,
      bancoNumero: body.bancoNumero,
      agencia: body.agencia,
      conta: body.conta,
      digito: body.digito,
      chaveApi: body.chaveApi,
      status: body.status,
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async deletar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.deletarContaBancariaUsecase.execute({
      companyUuid: req.companyUuid,
      contaBancariaUuid: uuid,
    });
    return res.status(200).json({ success: true });
  }
}
