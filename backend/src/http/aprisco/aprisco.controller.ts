import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { ApriscoQuery } from "src/@modules/aprisco/aprisco.query";
import { IncluirApriscoUsecase } from "src/@modules/aprisco/incluirAprisco/incluirAprisco.usecase";
import { AlterarApriscoUsecase } from "src/@modules/aprisco/alterarAprisco/alterarAprisco.usecase";
import { DeletarApriscoUsecase } from "src/@modules/aprisco/deletarAprisco/deletarAprisco.usecase";
import { VincularIntegranteUsecase } from "src/@modules/aprisco/vincularIntegrante/vincularIntegrante.usecase";
import { DisvincularIntegranteUsecase } from "src/@modules/aprisco/disvincularIntegrante/disvincularIntegrante.usecase";
import { RegistrarPresencaUsecase } from "src/@modules/aprisco/registrarPresenca/registrarPresenca.usecase";
import { validarDataReuniao } from "src/@modules/aprisco/registrarPresenca/presenca.entity";

function camposAprisco(body: any) {
  return {
    nome: body.nome,
    horario: body.horario,
    endereco: body.endereco,
    latitude: body.latitude,
    longitude: body.longitude,
    status: body.status,
  };
}

@Controller("apriscos")
export class ApriscoController {
  constructor(
    readonly apriscoQuery: ApriscoQuery,
    readonly incluirApriscoUsecase: IncluirApriscoUsecase,
    readonly alterarApriscoUsecase: AlterarApriscoUsecase,
    readonly deletarApriscoUsecase: DeletarApriscoUsecase,
    readonly vincularIntegranteUsecase: VincularIntegranteUsecase,
    readonly disvincularIntegranteUsecase: DisvincularIntegranteUsecase,
    readonly registrarPresencaUsecase: RegistrarPresencaUsecase,
  ) {}

  @Get()
  async listar(@Req() req: Request | any, @Res() res: Response) {
    const apriscos = await this.apriscoQuery.listarApriscos(req.companyUuid);
    return res.status(200).json({ success: true, data: apriscos });
  }

  /** Apriscos em que o usuário logado é LIDER */
  @Get("liderados")
  async listarLiderados(@Req() req: Request | any, @Res() res: Response) {
    const apriscos = await this.apriscoQuery.listarApriscosLiderados(req.companyUuid, req.userUuid);
    return res.status(200).json({ success: true, data: apriscos });
  }

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const aprisco = await this.apriscoQuery.buscarAprisco(req.companyUuid, uuid);
    if (!aprisco) throw new ApiError("Aprisco não encontrado", 404);
    return res.status(200).json({ success: true, data: aprisco });
  }

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.incluirApriscoUsecase.execute({
      companyUuid: req.companyUuid,
      ...camposAprisco(body),
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Put(":uuid")
  async alterar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.alterarApriscoUsecase.execute({
      companyUuid: req.companyUuid,
      apriscoUuid: uuid,
      ...camposAprisco(body),
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async deletar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    if (req.userPosition !== "admin") throw new ApiError("Apenas administradores podem excluir apriscos", 403);
    await this.deletarApriscoUsecase.execute({ companyUuid: req.companyUuid, apriscoUuid: uuid });
    return res.status(200).json({ success: true });
  }

  @Get(":uuid/integrantes")
  async listarIntegrantes(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const integrantes = await this.apriscoQuery.listarIntegrantes(req.companyUuid, uuid);
    return res.status(200).json({ success: true, data: integrantes });
  }

  @Post(":uuid/integrantes")
  async vincularIntegrante(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    const resultado = await this.vincularIntegranteUsecase.execute({
      companyUuid: req.companyUuid,
      apriscoUuid: uuid,
      pessoaUuid: body.pessoaUuid,
      papel: body.papel,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Delete(":uuid/integrantes/:integranteUuid")
  async disvincularIntegrante(
    @Req() req: Request | any,
    @Param("uuid") uuid: string,
    @Param("integranteUuid") integranteUuid: string,
    @Res() res: Response,
  ) {
    await this.disvincularIntegranteUsecase.execute({ companyUuid: req.companyUuid, apriscoUuid: uuid, integranteUuid });
    return res.status(200).json({ success: true });
  }

  /** Presenças dos integrantes em uma reunião: ?data=AAAA-MM-DD */
  @Get(":uuid/presencas")
  async listarPresencas(@Req() req: Request | any, @Param("uuid") uuid: string, @Query("data") data: string, @Res() res: Response) {
    const presencas = await this.apriscoQuery.listarPresencasIntegrantes(req.companyUuid, uuid, validarDataReuniao(data));
    return res.status(200).json({ success: true, data: presencas });
  }

  @Post(":uuid/presencas")
  async registrarPresenca(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    const resultado = await this.registrarPresencaUsecase.execute({
      companyUuid: req.companyUuid,
      apriscoUuid: uuid,
      tipo: body.tipo,
      pessoaUuid: body.pessoaUuid,
      dataReuniao: body.dataReuniao,
      presenca: body.presenca,
      quantidade: body.quantidade,
    });
    return res.status(201).json({ success: true, data: resultado });
  }
}
