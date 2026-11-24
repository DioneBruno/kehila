import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { ImoveisQuery } from "src/@modules/imoveis/imoveis.query";
import { PAPEIS_PESSOA, PessoaPapel } from "src/@modules/imoveis/shared/imoveis.tipos";
import { IncluirPessoaUsecase } from "src/@modules/imoveis/pessoas/incluirPessoa/incluirPessoa.usecase";
import { AlterarPessoaUsecase } from "src/@modules/imoveis/pessoas/alterarPessoa/alterarPessoa.usecase";
import { DeletarPessoaUsecase } from "src/@modules/imoveis/pessoas/deletarPessoa/deletarPessoa.usecase";
import { garantirUuid } from "src/@modules/imoveis/shared/garantirUuid";
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

function camposPessoa(body: any) {
  return {
    documento: body.documento,
    nome: body.nome,
    nomeFantasia: body.nomeFantasia,
    rgIe: body.rgIe,
    email: body.email,
    telefone: body.telefone,
    endereco: enderecoDoBody(body),
    observacoes: body.observacoes,
    ehProprietario: body.ehProprietario,
    ehInquilino: body.ehInquilino,
    ehFiador: body.ehFiador,
  };
}

@Controller("imoveis/pessoas")
export class PessoasController {
  constructor(
    readonly imoveisQuery: ImoveisQuery,
    readonly incluirPessoaUsecase: IncluirPessoaUsecase,
    readonly alterarPessoaUsecase: AlterarPessoaUsecase,
    readonly deletarPessoaUsecase: DeletarPessoaUsecase,
  ) {}

  @Get()
  async listar(
    @Req() req: Request | any,
    @Query("papel") papel: string,
    @Query("busca") busca: string,
    @Query("pagina") pagina: string,
    @Query("porPagina") porPagina: string,
    @Res() res: Response,
  ) {
    if (papel && !PAPEIS_PESSOA.includes(papel as PessoaPapel)) throw new ApiError("Papel inválido. Use: proprietario, inquilino ou fiador");
    const { data, total } = await this.imoveisQuery.listarPessoas(req.companyUuid, {
      papel: (papel || undefined) as PessoaPapel | undefined,
      busca,
      pagina: Number(pagina) > 0 ? Math.floor(Number(pagina)) : 1,
      porPagina: Number(porPagina) > 0 ? Math.min(Math.floor(Number(porPagina)), 100) : 20,
    });
    return res.status(200).json({ success: true, data, meta: { total } });
  }

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const pessoa = await this.imoveisQuery.buscarPessoa(req.companyUuid, garantirUuid(uuid, "Pessoa não encontrada"));
    if (!pessoa) throw new ApiError("Pessoa não encontrada", 404);
    return res.status(200).json({ success: true, data: pessoa });
  }

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.incluirPessoaUsecase.execute({
      companyUuid: req.companyUuid,
      tipo: body.tipo,
      ...camposPessoa(body),
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Patch(":uuid")
  async alterar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.alterarPessoaUsecase.execute({ companyUuid: req.companyUuid, uuid, ...camposPessoa(body) });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async deletar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    exigirAdmin(req);
    await this.deletarPessoaUsecase.execute({ companyUuid: req.companyUuid, uuid });
    return res.status(200).json({ success: true });
  }
}
