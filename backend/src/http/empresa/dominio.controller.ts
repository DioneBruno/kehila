import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CriarDominioUsecase } from "src/@modules/empresa/dominio/criarDominio/criarDominio.usecase";
import { ListarDominiosUsecase } from "src/@modules/empresa/dominio/listarDominios/listarDominios.usecase";
import { EditarDominioUsecase } from "src/@modules/empresa/dominio/editarDominio/editarDominio.usecase";
import { DeletarDominioUsecase } from "src/@modules/empresa/dominio/deletarDominio/deletarDominio.usecase";

@Controller("empresa/dominios")
export class DominioController {
  constructor(
    readonly criarDominioUsecase: CriarDominioUsecase,
    readonly listarDominiosUsecase: ListarDominiosUsecase,
    readonly editarDominioUsecase: EditarDominioUsecase,
    readonly deletarDominioUsecase: DeletarDominioUsecase,
  ) {}

  @Post()
  async criar(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const resultado = await this.criarDominioUsecase.execute({
      companyUuid: req.companyUuid,
      domain: body.domain,
      active: body.active,
    });
    return res.status(201).json({ success: true, data: resultado });
  }

  @Get()
  async listar(@Req() req: Request | any, @Res() res: Response) {
    const resultado = await this.listarDominiosUsecase.execute({
      companyUuid: req.companyUuid,
    });
    return res.status(200).json({ success: true, data: resultado });
  }

  @Put(":uuid")
  async editar(@Req() req: Request | any, @Param("uuid") uuid: string, @Body() body: any, @Res() res: Response) {
    await this.editarDominioUsecase.execute({
      companyUuid: req.companyUuid,
      dominioUuid: uuid,
      domain: body.domain,
      active: body.active,
    });
    return res.status(200).json({ success: true });
  }

  @Delete(":uuid")
  async deletar(@Req() req: Request | any, @Param("uuid") uuid: string, @Res() res: Response) {
    await this.deletarDominioUsecase.execute({
      companyUuid: req.companyUuid,
      dominioUuid: uuid,
    });
    return res.status(200).json({ success: true });
  }
}
