import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { MembresiaQuery } from "src/@modules/membresia/membresia.query";
import { IncluirMembroUsecase } from "src/@modules/membresia/incluirMembro/incluirMembro.usecase";
import { AlterarMembroUsecase } from "src/@modules/membresia/alterarMembro/alterarMembro.usecase";
import { DeletarMembroUsecase } from "src/@modules/membresia/deletarMembro/deletarMembro.usecase";

function camposMembro(body: any) {
  return {
    nome: body.nome,
    ativo: body.ativo,
    membro: body.membro,
    batizado: body.batizado,
    transferido: body.transferido,
    cpf: body.cpf,
    email: body.email,
    telefone: body.telefone,
    estadoCivil: body.estadoCivil,
    dataNascimento: body.dataNascimento,
    enderecoCep: body.enderecoCep,
    enderecoLogradouro: body.enderecoLogradouro,
    enderecoNumero: body.enderecoNumero,
    enderecoComplemento: body.enderecoComplemento,
    enderecoBairro: body.enderecoBairro,
    enderecoCidade: body.enderecoCidade,
    enderecoUf: body.enderecoUf,
    meta: body.meta,
  };
}

@Controller("membros")
export class MembresiaController {
  constructor(
    readonly membresiaQuery: MembresiaQuery,
    readonly incluirMembroUsecase: IncluirMembroUsecase,
    readonly alterarMembroUsecase: AlterarMembroUsecase,
    readonly deletarMembroUsecase: DeletarMembroUsecase,
  ) {}

  @Get()
  async listar(@Req() req: Request | any, @Res() res: Response) {
    const membros = await this.membresiaQuery.listarMembros(req.companyUuid);
    return res.status(200).json({ success: true, data: membros });
  }

  @Get(":uuid")
  async detalhar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    const membro = await this.membresiaQuery.buscarMembro(req.companyUuid, uuid);
    if (!membro) throw new ApiError("Membro não encontrado", 404);
    return res.status(200).json({ success: true, data: membro });
  }

  @Post()
  async incluir(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.incluirMembroUsecase.execute({
      companyUuid: req.companyUuid,
      ...camposMembro(body),
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Put(":uuid")
  async alterar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.alterarMembroUsecase.execute({
      companyUuid: req.companyUuid,
      membroUuid: uuid,
      ...camposMembro(body),
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async deletar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.deletarMembroUsecase.execute({ companyUuid: req.companyUuid, membroUuid: uuid });
    return res.status(200).json({ success: true });
  }
}
