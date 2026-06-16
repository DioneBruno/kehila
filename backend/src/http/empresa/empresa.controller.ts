import { Body, Controller, Delete, Get, Put, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { DetalharEmpresaUsecase } from "src/@modules/empresa/detalharEmpresa/detalharEmpresa.usecase";
import { EditarEmpresaUsecase } from "src/@modules/empresa/editarEmpresa/editarEmpresa.usecase";
import { DeletarEmpresaUsecase } from "src/@modules/empresa/deletarEmpresa/deletarEmpresa.usecase";

@Controller("empresa")
export class EmpresaController {
  constructor(
    readonly detalharEmpresaUsecase: DetalharEmpresaUsecase,
    readonly editarEmpresaUsecase: EditarEmpresaUsecase,
    readonly deletarEmpresaUsecase: DeletarEmpresaUsecase,
  ) {}

  @Get()
  async detalhar(@Req() req: Request | any, @Res() res: Response) {
    const resultado = await this.detalharEmpresaUsecase.execute({
      companyUuid: req.companyUuid,
    });
    return res.status(200).json({ success: true, data: resultado });
  }

  @Put()
  async editar(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    await this.editarEmpresaUsecase.execute({
      companyUuid: req.companyUuid,
      name: body.name,
      commercialName: body.commercialName,
      fantasyName: body.fantasyName,
      stateRegistration: body.stateRegistration,
      cpfCnpj: body.cpfCnpj,
      email: body.email,
      phone: body.phone,
      address: body.address,
      uf: body.uf,
    });
    return res.status(200).json({ success: true });
  }

  @Delete()
  async deletar(@Req() req: Request | any, @Res() res: Response) {
    await this.deletarEmpresaUsecase.execute({
      companyUuid: req.companyUuid,
    });
    return res.status(200).json({ success: true });
  }
}
