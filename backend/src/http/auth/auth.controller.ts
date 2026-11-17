import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { TokenGenerateUseCase } from "src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerate.usecase";
import { EnviarCodigoValidadorUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/enviarCodigoValidador.usecase";
import { GerarTokenAuthenticationUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/gerarTokenAuthentication.usecase";
import { TrustedDeviceUsecase } from "src/@modules/auth/trustedDevice/trustedDevice.usecase";
import { ApiJwt } from "src/@modules/shared/apiJwt";
//
@Controller("")
export class AuthController {
  constructor(
    readonly tokenGenerateUseCase: TokenGenerateUseCase,
    readonly enviarCodigoValidadorUsecase: EnviarCodigoValidadorUsecase,
    readonly gerarTokenAuthenticationUsecase: GerarTokenAuthenticationUsecase,
    readonly trustedDeviceUsecase: TrustedDeviceUsecase,
  ) {}

  @Post("token-generate")
  async tokenGenerate(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      username: body.username,
      password: body.password,
    };
    const result: { token: string; deviceToken?: string } = await this.tokenGenerateUseCase.execute(input);

    if (body.trustDevice === true) {
      const payload = ApiJwt.tokenDecoding(result.token);
      result.deviceToken = await this.trustedDeviceUsecase.emitir({
        companyUuid: req.companyUuid,
        userUuid: payload.user.uuid,
        deviceName: req.headers["user-agent"] ?? null,
      });
    }

    return res.status(200).json(result);
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

  @Post("trusted-device/login")
  async trustedDeviceLogin(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const result = await this.trustedDeviceUsecase.login({
      companyUuid: req.companyUuid,
      deviceToken: body?.deviceToken,
    });

    return res.status(200).json(result);
  }

  @Post("trusted-device/revoke")
  async trustedDeviceRevoke(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    await this.trustedDeviceUsecase.revogar({
      companyUuid: req.companyUuid,
      deviceToken: body?.deviceToken,
    });

    return res.status(204).send();
  }
}
