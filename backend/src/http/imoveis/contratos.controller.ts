import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { ImoveisQuery } from "src/@modules/imoveis/imoveis.query";
import { CONTRATO_STATUS, ContratoStatus } from "src/@modules/imoveis/shared/imoveis.tipos";
import { garantirUuid } from "src/@modules/imoveis/shared/garantirUuid";
import { IncluirContratoUsecase } from "src/@modules/imoveis/contratos/incluirContrato/incluirContrato.usecase";
import { AlterarContratoUsecase } from "src/@modules/imoveis/contratos/alterarContrato/alterarContrato.usecase";
import { RegistrarEventoContratoUsecase } from "src/@modules/imoveis/contratos/registrarEventoContrato/registrarEventoContrato.usecase";

const MSG_CONTRATO_NAO_ENCONTRADO = "Contrato não encontrado";

/** Campos editáveis do contrato. fim, valorAluguel, status, imovelUuid e inquilinoUuid nunca são repassados ao alterar. */
function camposEditaveis(body: any) {
  return {
    numero: body.numero,
    inicio: body.inicio,
    diaVencimento: body.diaVencimento,
    indiceReajuste: body.indiceReajuste,
    mesReajuste: body.mesReajuste,
    multaAtrasoPct: body.multaAtrasoPct,
    jurosMesPct: body.jurosMesPct,
    descontoPontualidadePct: body.descontoPontualidadePct,
    multaRescisoriaMeses: body.multaRescisoriaMeses,
    garantiaTipo: body.garantiaTipo,
    garantiaValor: body.garantiaValor,
    fiadorUuid: body.fiadorUuid,
    observacoes: body.observacoes,
  };
}

const uuidOpcional = (valor: string, mensagem: string) => (valor ? garantirUuid(valor, mensagem) : undefined);

@Controller("imoveis/contratos")
export class ContratosController {
  constructor(
    readonly imoveisQuery: ImoveisQuery,
    readonly incluirContratoUsecase: IncluirContratoUsecase,
    readonly alterarContratoUsecase: AlterarContratoUsecase,
    readonly registrarEventoContratoUsecase: RegistrarEventoContratoUsecase,
  ) {}

  @Get()
  async listar(
    @Req() req: Request | any,
    @Query("proprietarioUuid") proprietarioUuid: string,
    @Query("imovelUuid") imovelUuid: string,
    @Query("inquilinoUuid") inquilinoUuid: string,
    @Query("status") status: string,
    @Query("busca") busca: string,
    @Query("pagina") pagina: string,
    @Query("porPagina") porPagina: string,
    @Res() res: Response,
  ) {
    if (status && !CONTRATO_STATUS.includes(status as ContratoStatus)) throw new ApiError("Status inválido");
    const { data, total } = await this.imoveisQuery.listarContratos(req.companyUuid, {
      proprietarioUuid: uuidOpcional(proprietarioUuid, "Proprietário não encontrado"),
      imovelUuid: uuidOpcional(imovelUuid, "Imóvel não encontrado"),
      inquilinoUuid: uuidOpcional(inquilinoUuid, "Inquilino não encontrado"),
      status: (status || undefined) as ContratoStatus | undefined,
      busca,
      pagina: Number(pagina) > 0 ? Math.floor(Number(pagina)) : 1,
      porPagina: Number(porPagina) > 0 ? Math.min(Math.floor(Number(porPagina)), 100) : 20,
    });
    return res.status(200).json({ success: true, data, meta: { total } });
  }

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const contrato = await this.imoveisQuery.buscarContrato(req.companyUuid, garantirUuid(uuid, MSG_CONTRATO_NAO_ENCONTRADO));
    if (!contrato) throw new ApiError(MSG_CONTRATO_NAO_ENCONTRADO, 404);
    return res.status(200).json({ success: true, data: contrato });
  }

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.incluirContratoUsecase.execute({
      companyUuid: req.companyUuid,
      imovelUuid: body.imovelUuid,
      inquilinoUuid: body.inquilinoUuid,
      fim: body.fim,
      valorAluguel: body.valorAluguel,
      ...camposEditaveis(body),
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Patch(":uuid")
  async alterar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.alterarContratoUsecase.execute({
      companyUuid: req.companyUuid,
      uuid: garantirUuid(uuid, MSG_CONTRATO_NAO_ENCONTRADO),
      ...camposEditaveis(body),
    });
    return res.status(200).json({ success: true });
  }

  @Get(":uuid/eventos")
  async listarEventos(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const eventos = await this.imoveisQuery.listarEventosContrato(req.companyUuid, garantirUuid(uuid, MSG_CONTRATO_NAO_ENCONTRADO));
    if (!eventos) throw new ApiError(MSG_CONTRATO_NAO_ENCONTRADO, 404);
    return res.status(200).json({ success: true, data: eventos });
  }

  @Post(":uuid/eventos")
  async registrarEvento(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    const resultado = await this.registrarEventoContratoUsecase.execute({
      companyUuid: req.companyUuid,
      userUuid: req.userUuid,
      contratoUuid: garantirUuid(uuid, MSG_CONTRATO_NAO_ENCONTRADO),
      tipo: body.tipo,
      data: body.data,
      descricao: body.descricao,
      valorNovo: body.valorNovo,
      fimNovo: body.fimNovo,
    });
    return res.status(201).json({ success: true, data: resultado });
  }
}
