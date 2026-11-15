import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiError } from "src/@modules/shared/apiError";
import { ApriscoQuery } from "src/@modules/aprisco/aprisco.query";
import { IncluirApriscoUsecase } from "src/@modules/aprisco/incluirAprisco/incluirAprisco.usecase";
import { AlterarApriscoUsecase } from "src/@modules/aprisco/alterarAprisco/alterarAprisco.usecase";
import { DeletarApriscoUsecase } from "src/@modules/aprisco/deletarAprisco/deletarAprisco.usecase";

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
  ) {}

  @Get()
  async listar(@Req() req: Request | any, @Res() res: Response) {
    const apriscos = await this.apriscoQuery.listarApriscos(req.companyUuid);
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
    await this.deletarApriscoUsecase.execute({ companyUuid: req.companyUuid, apriscoUuid: uuid });
    return res.status(200).json({ success: true });
  }
}
