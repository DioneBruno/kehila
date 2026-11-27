import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { ApiDate } from "src/@modules/shared/apiDate";
import { ImoveisQuery } from "src/@modules/imoveis/imoveis.query";
import {
  CATEGORIAS_POR_TIPO,
  CONTA_RESPONSAVEIS,
  CONTA_SITUACOES,
  CONTA_TIPOS,
  ContaResponsavel,
  ContaSituacao,
  ContaTipo,
} from "src/@modules/imoveis/shared/imoveis.tipos";
import { garantirUuid } from "src/@modules/imoveis/shared/garantirUuid";
import { validarData } from "src/@modules/imoveis/contratos/contrato.entity";
import {
  MSG_CATEGORIA_INVALIDA,
  MSG_CONTA_NAO_ENCONTRADA,
  MSG_PROPRIETARIO_NAO_ENCONTRADO,
  MSG_RESPONSAVEL_INVALIDO,
  MSG_TIPO_INVALIDO,
} from "src/@modules/imoveis/contas/conta.entity";
import { IncluirContaUsecase } from "src/@modules/imoveis/contas/incluirConta/incluirConta.usecase";
import { GerarParcelasUsecase } from "src/@modules/imoveis/contas/gerarParcelas/gerarParcelas.usecase";
import { AlterarContaUsecase } from "src/@modules/imoveis/contas/alterarConta/alterarConta.usecase";
import { DeletarContaUsecase } from "src/@modules/imoveis/contas/deletarConta/deletarConta.usecase";
import { PagamentoContaUsecase } from "src/@modules/imoveis/contas/pagamentoConta/pagamentoConta.usecase";
import {
  ANEXO_TAMANHO_MAXIMO,
  EnviarAnexoContaUsecase,
  RemoverAnexoContaUsecase,
  UrlAnexoContaUsecase,
} from "src/@modules/imoveis/contas/anexos/anexosConta";
import { exigirAdmin } from "../middleware/perfil.middleware";

const MSG_IMOVEL_NAO_ENCONTRADO = "Imóvel não encontrado";
const MSG_CONTRATO_NAO_ENCONTRADO = "Contrato não encontrado";
const MSG_SITUACAO_INVALIDA = "Situação inválida";
const MSG_VENCIMENTO_DE_INVALIDO = "Data inicial do vencimento inválida";
const MSG_VENCIMENTO_ATE_INVALIDO = "Data final do vencimento inválida";

const uuidOpcional = (valor: unknown, mensagem: string) => {
  if (valor === undefined || valor === "") return undefined;
  if (typeof valor !== "string") throw new ApiError(mensagem, 404);
  return garantirUuid(valor, mensagem);
};

/** Query string repetida (?a=1&a=2) vira array: não é um valor aceitável para filtro. */
const textoOpcional = (valor: unknown, mensagem: string): string | undefined => {
  if (valor === undefined || valor === "") return undefined;
  if (typeof valor !== "string") throw new ApiError(mensagem);
  return valor;
};

const dataOpcional = (valor: unknown, mensagem: string) => {
  const texto = textoOpcional(valor, mensagem);
  return texto === undefined ? undefined : validarData(texto, mensagem);
};

function enumOpcional<T extends string>(valor: unknown, lista: T[], mensagem: string): T | undefined {
  const texto = textoOpcional(valor, mensagem);
  if (texto === undefined) return undefined;
  if (!lista.includes(texto as T)) throw new ApiError(mensagem);
  return texto as T;
}

function categoriaOpcional(valor: unknown, tipo: ContaTipo | undefined): string | undefined {
  const texto = textoOpcional(valor, MSG_CATEGORIA_INVALIDA);
  if (texto === undefined) return undefined;
  const validas = tipo ? CATEGORIAS_POR_TIPO[tipo] : Object.values(CATEGORIAS_POR_TIPO).flat();
  if (!validas.includes(texto)) throw new ApiError(MSG_CATEGORIA_INVALIDA);
  return texto;
}

/** Quantidade só vira número se vier numérica e não vazia; o resto segue como está para o use case rejeitar. */
function quantidadeParcelas(valor: unknown): unknown {
  if (typeof valor === "string" && valor.trim() !== "" && Number.isFinite(Number(valor))) return Number(valor);
  return valor;
}

const hojeAtual = () => ApiDate.now("YYYY-MM-DD");

@Controller("imoveis/contas")
export class ContasController {
  constructor(
    readonly imoveisQuery: ImoveisQuery,
    readonly incluirContaUsecase: IncluirContaUsecase,
    readonly gerarParcelasUsecase: GerarParcelasUsecase,
    readonly alterarContaUsecase: AlterarContaUsecase,
    readonly deletarContaUsecase: DeletarContaUsecase,
    readonly pagamentoContaUsecase: PagamentoContaUsecase,
    readonly enviarAnexoContaUsecase: EnviarAnexoContaUsecase,
    readonly urlAnexoContaUsecase: UrlAnexoContaUsecase,
    readonly removerAnexoContaUsecase: RemoverAnexoContaUsecase,
  ) {}

  @Get()
  async listar(
    @Req() req: Request | any,
    @Query("tipo") tipoBruto: string,
    @Query("categoria") categoria: string,
    @Query("proprietarioUuid") proprietarioUuid: string,
    @Query("imovelUuid") imovelUuid: string,
    @Query("contratoUuid") contratoUuid: string,
    @Query("situacao") situacao: string,
    @Query("responsavel") responsavel: string,
    @Query("vencimentoDe") vencimentoDe: string,
    @Query("vencimentoAte") vencimentoAte: string,
    @Query("busca") busca: string,
    @Query("pagina") pagina: string,
    @Query("porPagina") porPagina: string,
    @Res() res: Response,
  ) {
    const tipo = enumOpcional<ContaTipo>(tipoBruto, CONTA_TIPOS, MSG_TIPO_INVALIDO);
    const { data, total, totalValor, totalPago } = await this.imoveisQuery.listarContas(
      req.companyUuid,
      {
        tipo,
        categoria: categoriaOpcional(categoria, tipo),
        proprietarioUuid: uuidOpcional(proprietarioUuid, MSG_PROPRIETARIO_NAO_ENCONTRADO),
        imovelUuid: uuidOpcional(imovelUuid, MSG_IMOVEL_NAO_ENCONTRADO),
        contratoUuid: uuidOpcional(contratoUuid, MSG_CONTRATO_NAO_ENCONTRADO),
        situacao: enumOpcional<ContaSituacao>(situacao, CONTA_SITUACOES, MSG_SITUACAO_INVALIDA),
        responsavel: enumOpcional<ContaResponsavel>(responsavel, CONTA_RESPONSAVEIS, MSG_RESPONSAVEL_INVALIDO),
        vencimentoDe: dataOpcional(vencimentoDe, MSG_VENCIMENTO_DE_INVALIDO),
        vencimentoAte: dataOpcional(vencimentoAte, MSG_VENCIMENTO_ATE_INVALIDO),
        busca: typeof busca === "string" ? busca : undefined,
        pagina: Number(pagina) > 0 ? Math.floor(Number(pagina)) : 1,
        porPagina: Number(porPagina) > 0 ? Math.min(Math.floor(Number(porPagina)), 100) : 20,
      },
      hojeAtual(),
    );
    return res.status(200).json({ success: true, data, meta: { total, totalValor, totalPago } });
  }

  // "agenda" e "parcelas" precisam vir antes de ":uuid".
  @Get("agenda")
  async agenda(
    @Req() req: Request | any,
    @Query("proprietarioUuid") proprietarioUuid: string,
    @Query("imovelUuid") imovelUuid: string,
    @Query("tipo") tipo: string,
    @Res() res: Response,
  ) {
    const data = await this.imoveisQuery.agendaContas(req.companyUuid, hojeAtual(), {
      proprietarioUuid: uuidOpcional(proprietarioUuid, MSG_PROPRIETARIO_NAO_ENCONTRADO),
      imovelUuid: uuidOpcional(imovelUuid, MSG_IMOVEL_NAO_ENCONTRADO),
      tipo: enumOpcional<ContaTipo>(tipo, CONTA_TIPOS, MSG_TIPO_INVALIDO),
    });
    return res.status(200).json({ success: true, data });
  }

  @Post("parcelas")
  async gerarParcelas(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.gerarParcelasUsecase.execute({
      ...body,
      quantidade: quantidadeParcelas(body?.quantidade),
      companyUuid: req.companyUuid,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const conta = await this.imoveisQuery.buscarConta(req.companyUuid, garantirUuid(uuid, MSG_CONTA_NAO_ENCONTRADA), hojeAtual());
    if (!conta) throw new ApiError(MSG_CONTA_NAO_ENCONTRADA, 404);
    return res.status(200).json({ success: true, data: conta });
  }

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.incluirContaUsecase.execute({ ...body, companyUuid: req.companyUuid, hoje: hojeAtual() });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Patch(":uuid")
  async alterar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.alterarContaUsecase.execute({ ...body, companyUuid: req.companyUuid, uuid });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async excluir(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    exigirAdmin(req);
    await this.deletarContaUsecase.execute({ companyUuid: req.companyUuid, uuid });
    return res.status(200).json({ success: true });
  }

  @Post(":uuid/pagamento")
  async registrarPagamento(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.pagamentoContaUsecase.registrar({ ...body, companyUuid: req.companyUuid, uuid, hoje: hojeAtual() });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid/pagamento")
  async desfazerPagamento(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.pagamentoContaUsecase.desfazer({ companyUuid: req.companyUuid, uuid });
    return res.status(200).json({ success: true });
  }

  @Post(":uuid/anexos")
  @UseInterceptors(FileInterceptor("arquivo", { limits: { fileSize: ANEXO_TAMANHO_MAXIMO + 1 } }))
  async enviarAnexo(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @UploadedFile() arquivo: any, @Res() res: Response) {
    const data = await this.enviarAnexoContaUsecase.execute({
      tipo: body?.tipo,
      buffer: arquivo?.buffer,
      nomeArquivo: arquivo?.originalname,
      companyUuid: req.companyUuid,
      contaUuid: uuid,
    });
    return res.status(201).json({ success: true, data });
  }

  @Get(":uuid/anexos/:anexoUuid/url")
  async urlAnexo(@Req() req: Request | any, @Param("uuid") uuid: string, @Param("anexoUuid") anexoUuid: string, @Res() res: Response) {
    const data = await this.urlAnexoContaUsecase.execute({ companyUuid: req.companyUuid, contaUuid: uuid, anexoUuid });
    return res.status(200).json({ success: true, data });
  }

  @Delete(":uuid/anexos/:anexoUuid")
  async removerAnexo(@Req() req: Request | any, @Param("uuid") uuid: string, @Param("anexoUuid") anexoUuid: string, @Res() res: Response) {
    await this.removerAnexoContaUsecase.execute({ companyUuid: req.companyUuid, contaUuid: uuid, anexoUuid });
    return res.status(200).json({ success: true });
  }
}
