import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CriarEventoUsecase } from "src/@modules/portalEventos/eventos/criarEvento/criarEvento.usecase";
import { ListarEventosUsecase } from "src/@modules/portalEventos/eventos/listarEventos/listarEventos.usecase";
import { DetalharEventoUsecase } from "src/@modules/portalEventos/eventos/detalharEvento/detalharEvento.usecase";
import { EditarEventoUsecase } from "src/@modules/portalEventos/eventos/editarEvento/editarEvento.usecase";
import { AtualizarStatusEventoUsecase } from "src/@modules/portalEventos/eventos/atualizarStatusEvento/atualizarStatusEvento.usecase";
import { PortalEventosQuery } from "src/@modules/portalEventos/portalEventos.query";

@Controller("eventos")
export class EventosController {
  constructor(
    readonly portalEventosQuery: PortalEventosQuery,
    readonly criarEventoUsecase: CriarEventoUsecase,
    readonly listarEventosUsecase: ListarEventosUsecase,
    readonly detalharEventoUsecase: DetalharEventoUsecase,
    readonly editarEventoUsecase: EditarEventoUsecase,
    readonly atualizarStatusEventoUsecase: AtualizarStatusEventoUsecase,
  ) {}

  @Get(":uuid/inscritos")
  async listaPublicaInscritos(@Param("uuid") uuid: string, @Res() res: Response) {
    const resultado = await this.portalEventosQuery.listaPublicaInscritos(uuid);
    return res.status(200).json({ success: true, data: resultado });
  }

  @Post()
  async criar(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.criarEventoUsecase.execute({
      companyUuid: req.companyUuid,
      userUuid: req.userUuid,
      titulo: body.titulo,
      descricao: body.descricao,
      bannerUrl: body.bannerUrl,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      capacidadeTotal: body.capacidadeTotal,
      localNome: body.localNome,
      localEndereco: body.localEndereco,
      localLat: body.localLat,
      localLng: body.localLng,
      online: body.online,
      linkOnline: body.linkOnline,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Get()
  async listar(@Req() req: Request | any, @Query() query: any, @Res() res: Response) {
    const resultado = await this.listarEventosUsecase.execute({
      companyUuid: req.companyUuid,
      status: query.status,
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
    const resultado = await this.detalharEventoUsecase.execute({
      companyUuid: req.companyUuid,
      eventoUuid: uuid,
    });
    return res.status(200).json({ success: true, data: resultado });
  }

  @Put(":uuid")
  async editar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.editarEventoUsecase.execute({
      companyUuid: req.companyUuid,
      eventoUuid: uuid,
      titulo: body.titulo,
      descricao: body.descricao,
      bannerUrl: body.bannerUrl,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      capacidadeTotal: body.capacidadeTotal,
      localNome: body.localNome,
      localEndereco: body.localEndereco,
      localLat: body.localLat,
      localLng: body.localLng,
      online: body.online,
      linkOnline: body.linkOnline,
    });
    return res.status(200).json({ success: true });
  }

  @Patch(":uuid/publicar")
  async publicar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.atualizarStatusEventoUsecase.execute({
      companyUuid: req.companyUuid,
      eventoUuid: uuid,
      acao: "publicar",
    });
    return res.status(200).json({ success: true });
  }

  @Patch(":uuid/cancelar")
  async cancelar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.atualizarStatusEventoUsecase.execute({
      companyUuid: req.companyUuid,
      eventoUuid: uuid,
      acao: "cancelar",
    });
    return res.status(200).json({ success: true });
  }

  @Patch(":uuid/encerrar")
  async encerrar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.atualizarStatusEventoUsecase.execute({
      companyUuid: req.companyUuid,
      eventoUuid: uuid,
      acao: "encerrar",
    });
    return res.status(200).json({ success: true });
  }
}
