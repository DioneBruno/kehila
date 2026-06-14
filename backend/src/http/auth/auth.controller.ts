import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { TokenGenerateUseCase } from "src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerate.usecase";
import { EnviarCodigoValidadorUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/enviarCodigoValidador.usecase";
import { GerarTokenAuthenticationUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/gerarTokenAuthentication.usecase";
//
@Controller("")
export class AuthController {
  constructor(
    readonly tokenGenerateUseCase: TokenGenerateUseCase,
    readonly enviarCodigoValidadorUsecase: EnviarCodigoValidadorUsecase,
    readonly gerarTokenAuthenticationUsecase: GerarTokenAuthenticationUsecase,
  ) {}

  @Post("token-generate")
  async tokenGenerate(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      username: body.username,
      password: body.password,
    };
    const token = await this.tokenGenerateUseCase.execute(input);

    return res.status(200).json(token);
  }

  @Post("random-code-authentication/generate")
  async generateRandomCode(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      username: body.username,
    };
    const result = await this.enviarCodigoValidadorUsecase.execute(input);

    return res.status(200).json(result);
  }

  @Post("random-code-authentication/validate")
  async validateRandomCode(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      username: body.username,
      code: body.code,
    };
    const token = await this.gerarTokenAuthenticationUsecase.execute(input);

    return res.status(200).json(token);
  }
}
