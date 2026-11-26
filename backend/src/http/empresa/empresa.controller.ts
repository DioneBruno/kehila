import { Body, Controller, Delete, Get, Post, Put, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { DetalharEmpresaUsecase } from "src/@modules/empresa/detalharEmpresa/detalharEmpresa.usecase";
import { EditarEmpresaUsecase } from "src/@modules/empresa/editarEmpresa/editarEmpresa.usecase";
import { DeletarEmpresaUsecase } from "src/@modules/empresa/deletarEmpresa/deletarEmpresa.usecase";
import {
  EnviarImagemLoginUsecase,
  IMAGEM_LOGIN_TAMANHO_MAXIMO,
  ImagemLoginUrl,
  RemoverImagemLoginUsecase,
} from "src/@modules/empresa/layout/imagemLogin/imagemLogin";

@Controller("empresa")
export class EmpresaController {
  constructor(
    readonly detalharEmpresaUsecase: DetalharEmpresaUsecase,
    readonly editarEmpresaUsecase: EditarEmpresaUsecase,
    readonly deletarEmpresaUsecase: DeletarEmpresaUsecase,
    readonly enviarImagemLoginUsecase: EnviarImagemLoginUsecase,
    readonly removerImagemLoginUsecase: RemoverImagemLoginUsecase,
    readonly imagemLoginUrl: ImagemLoginUrl,
  ) {}

  @Get()
  async detalhar(@Req() req: Request | any, @Res() res: Response) {
    const resultado = await this.detalharEmpresaUsecase.execute({
      companyUuid: req.companyUuid,
    });
    const imagemLoginUrl = await this.imagemLoginUrl.gerar(resultado.layout);
    return res.status(200).json({ success: true, data: { ...resultado, imagemLoginUrl } });
  }

  @Post("layout/imagem-login")
  @UseInterceptors(FileInterceptor("arquivo", { limits: { fileSize: IMAGEM_LOGIN_TAMANHO_MAXIMO + 1 } }))
  async enviarImagemLogin(@Req() req: Request | any, @UploadedFile() arquivo: any, @Res() res: Response) {
    const data = await this.enviarImagemLoginUsecase.execute({ companyUuid: req.companyUuid, buffer: arquivo?.buffer });
    return res.status(201).json({ success: true, data });
  }

  @Delete("layout/imagem-login")
  async removerImagemLogin(@Req() req: Request | any, @Res() res: Response) {
    await this.removerImagemLoginUsecase.execute({ companyUuid: req.companyUuid });
    return res.status(200).json({ success: true });
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
      layout: body.layout,
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
