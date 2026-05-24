import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CriarLoteUsecase } from "src/@modules/portalEventos/lotes/criarLote/criarLote.usecase";
import { ListarLotesUsecase } from "src/@modules/portalEventos/lotes/listarLotes/listarLotes.usecase";
import { EditarLoteUsecase } from "src/@modules/portalEventos/lotes/editarLote/editarLote.usecase";
import { RemoverLoteUsecase } from "src/@modules/portalEventos/lotes/removerLote/removerLote.usecase";
import { CriarTipoIngressoUsecase } from "src/@modules/portalEventos/lotes/criarTipoIngresso/criarTipoIngresso.usecase";
import { EditarTipoIngressoUsecase } from "src/@modules/portalEventos/lotes/editarTipoIngresso/editarTipoIngresso.usecase";
import { RemoverTipoIngressoUsecase } from "src/@modules/portalEventos/lotes/removerTipoIngresso/removerTipoIngresso.usecase";

@Controller("lotes")
export class LotesController {
  constructor(
    readonly criarLoteUsecase: CriarLoteUsecase,
    readonly listarLotesUsecase: ListarLotesUsecase,
    readonly editarLoteUsecase: EditarLoteUsecase,
    readonly removerLoteUsecase: RemoverLoteUsecase,
    readonly criarTipoIngressoUsecase: CriarTipoIngressoUsecase,
    readonly editarTipoIngressoUsecase: EditarTipoIngressoUsecase,
    readonly removerTipoIngressoUsecase: RemoverTipoIngressoUsecase,
  ) {}

  @Post()
  async criar(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.criarLoteUsecase.execute({
      companyUuid: req.companyUuid,
      eventoUuid: body.eventoUuid,
      nome: body.nome,
      ordem: body.ordem,
      quantidade: body.quantidade,
      preco: body.preco,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      ativo: body.ativo,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Get()
  async listar(@Req() req: Request | any, @Query() query: any, @Res() res: Response) {
    const resultado = await this.listarLotesUsecase.execute({
      companyUuid: req.companyUuid,
      eventoUuid: query.eventoUuid,
    });
    return res.status(200).json({ success: true, data: resultado });
  }

  @Put(":uuid")
  async editar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.editarLoteUsecase.execute({
      companyUuid: req.companyUuid,
      loteUuid: uuid,
      nome: body.nome,
      ordem: body.ordem,
      quantidade: body.quantidade,
      preco: body.preco,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      ativo: body.ativo,
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async remover(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.removerLoteUsecase.execute({
      companyUuid: req.companyUuid,
      loteUuid: uuid,
    });
    return res.status(200).json({ success: true });
  }

  @Post(":loteUuid/tipos-ingresso")
  async criarTipo(@Req() req: Request | any, @Param("loteUuid") loteUuid: string, @Body() body: any, @Res() res: Response) {
    const resultado = await this.criarTipoIngressoUsecase.execute({
      companyUuid: req.companyUuid,
      loteUuid,
      nome: body.nome,
      descricao: body.descricao,
      quantidade: body.quantidade,
      gerarQuantidadeIngressos: body.gerarQuantidadeIngressos,
      preco: body.preco,
      visivel: body.visivel,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Put(":loteUuid/tipos-ingresso/:tipoUuid")
  async editarTipo(@Req() req: Request | any, @Param("tipoUuid") tipoUuid: string, @Body() body: any, @Res() res: Response) {
    await this.editarTipoIngressoUsecase.execute({
      companyUuid: req.companyUuid,
      tipoUuid,
      nome: body.nome,
      descricao: body.descricao,
      quantidade: body.quantidade,
      gerarQuantidadeIngressos: body.gerarQuantidadeIngressos,
      preco: body.preco,
      visivel: body.visivel,
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":loteUuid/tipos-ingresso/:tipoUuid")
  async removerTipo(@Req() req: Request | any, @Param("tipoUuid") tipoUuid: string, @Res() res: Response) {
    await this.removerTipoIngressoUsecase.execute({
      companyUuid: req.companyUuid,
      tipoUuid,
    });
    return res.status(200).json({ success: true });
  }
}
