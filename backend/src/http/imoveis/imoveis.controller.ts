import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { ImoveisQuery } from "src/@modules/imoveis/imoveis.query";
import { IMOVEL_SITUACOES, ImovelSituacao } from "src/@modules/imoveis/shared/imoveis.tipos";
import { garantirUuid } from "src/@modules/imoveis/shared/garantirUuid";
import { IncluirImovelUsecase } from "src/@modules/imoveis/imoveis/incluirImovel/incluirImovel.usecase";
import { AlterarImovelUsecase } from "src/@modules/imoveis/imoveis/alterarImovel/alterarImovel.usecase";
import { DeletarImovelUsecase } from "src/@modules/imoveis/imoveis/deletarImovel/deletarImovel.usecase";
import { exigirAdmin } from "../middleware/perfil.middleware";

function enderecoDoBody(body: any) {
  const e = body?.endereco;
  if (e === undefined) return undefined;
  return {
    cep: e?.cep,
    logradouro: e?.logradouro,
    numero: e?.numero,
    complemento: e?.complemento,
    bairro: e?.bairro,
    cidade: e?.cidade,
    uf: e?.uf,
  };
}

function camposImovel(body: any) {
  return {
    proprietarioUuid: body.proprietarioUuid,
    identificacao: body.identificacao,
    tipo: body.tipo,
    finalidade: body.finalidade,
    endereco: enderecoDoBody(body),
    inscricaoIptu: body.inscricaoIptu,
    matricula: body.matricula,
    cartorio: body.cartorio,
    areaM2: body.areaM2,
    observacoes: body.observacoes,
  };
}

@Controller("imoveis/imoveis")
export class ImoveisController {
  constructor(
    readonly imoveisQuery: ImoveisQuery,
    readonly incluirImovelUsecase: IncluirImovelUsecase,
    readonly alterarImovelUsecase: AlterarImovelUsecase,
    readonly deletarImovelUsecase: DeletarImovelUsecase,
  ) {}

  @Get()
  async listar(
    @Req() req: Request | any,
    @Query("proprietarioUuid") proprietarioUuid: string,
    @Query("situacao") situacao: string,
    @Query("busca") busca: string,
    @Query("pagina") pagina: string,
    @Query("porPagina") porPagina: string,
    @Res() res: Response,
  ) {
    if (situacao && !IMOVEL_SITUACOES.includes(situacao as ImovelSituacao)) throw new ApiError("Situação inválida");
    const { data, total } = await this.imoveisQuery.listarImoveis(req.companyUuid, {
      proprietarioUuid: proprietarioUuid ? garantirUuid(proprietarioUuid, "Proprietário não encontrado") : undefined,
      situacao: (situacao || undefined) as ImovelSituacao | undefined,
      busca,
      pagina: Number(pagina) > 0 ? Math.floor(Number(pagina)) : 1,
      porPagina: Number(porPagina) > 0 ? Math.min(Math.floor(Number(porPagina)), 100) : 20,
    });
    return res.status(200).json({ success: true, data, meta: { total } });
  }

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const imovel = await this.imoveisQuery.buscarImovel(req.companyUuid, garantirUuid(uuid, "Imóvel não encontrado"));
    if (!imovel) throw new ApiError("Imóvel não encontrado", 404);
    return res.status(200).json({ success: true, data: imovel });
  }

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.incluirImovelUsecase.execute({ companyUuid: req.companyUuid, ...camposImovel(body) });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Patch(":uuid")
  async alterar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.alterarImovelUsecase.execute({
      companyUuid: req.companyUuid,
      uuid: garantirUuid(uuid, "Imóvel não encontrado"),
      ...camposImovel(body),
      situacao: body.situacao,
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async deletar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    exigirAdmin(req);
    await this.deletarImovelUsecase.execute({ companyUuid: req.companyUuid, uuid: garantirUuid(uuid, "Imóvel não encontrado") });
    return res.status(200).json({ success: true });
  }
}
