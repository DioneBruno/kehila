import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { BiEditarUsecase } from "src/@modules/bi/biEditar.usecase";
import { BiIncluirUsecase } from "src/@modules/bi/biIncluir.usecase";
import { BiMontarUsecase } from "src/@modules/bi/biMontar.usecase";
import { BiRepository } from "src/@modules/bi/biRepostiory";

@Controller("bi")
export class BiController {
  constructor(
    readonly biRepository: BiRepository,
    readonly biIncluirUsecase: BiIncluirUsecase,
    readonly biEditarUsecase: BiEditarUsecase,
    readonly biMontarUsecase: BiMontarUsecase,
  ) {}

  @Post("")
  async biListar(@Req() request: Request | any, @Body() body: any, @Res() response: Response) {
    const companyUuid = request.companyUuid;
    const userUuid = request.userUuid;
    const result = await this.biRepository.biListar(companyUuid, userUuid, body.filtros);
    response.status(HttpStatus.OK).send(result);
  }

  @Post("salvar")
  async biIncluir(@Req() request: Request | any, @Res() response: Response, @Body() body: any) {
    const companyUuid = request.companyUuid;
    const input = {
      companyUuid,
      gateway: body.gateway,
      uuid: body.uuid,
      titulo: body.titulo,
      descricao: body.descricao,
      referencia: body.referencia,
      parametros: body.parametros,
      roles: body.roles,
    };

    if (body.uuid) {
      await this.biEditarUsecase.execute(input);
    } else {
      await this.biIncluirUsecase.execute(input);
    }

    response.status(HttpStatus.OK).send({ message: "BI salvo com sucesso." });
  }

  @Delete(":uuid")
  async biDelete(@Req() request: Request, @Res() response: Response, @Param("uuid") uuid: string) {
    await this.biRepository.biDelete(uuid);
    response.status(HttpStatus.OK).send({ message: "BI removido com sucesso." });
  }

  @Get(":uuid/montar")
  async biMontar(@Req() request: Request | any, @Res() response: Response, @Param("uuid") uuid: string) {
    const companyUuid = request?.companyUuid;
    const input = {
      companyUuid,
      uuid,
    };
    const res = await this.biMontarUsecase.execute(input);
    response.status(HttpStatus.OK).send(res);
  }
}
