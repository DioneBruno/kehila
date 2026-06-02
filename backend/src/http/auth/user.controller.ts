import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { DecoderTokenAuthenticationUsecase } from "src/@modules/auth/decoderTokenAuthentication/decoderTokenAuthentication.uscase";

@Controller("auth")
export class UserController {
  constructor(readonly decoderTokenAuthenticationUsecase: DecoderTokenAuthenticationUsecase) {}

  @Post("me")
  async me(@Req() req: Request | any, @Res() res: Response) {
    const payload = await this.decoderTokenAuthenticationUsecase.execute({
      token: req.headers.authorization.slice(7),
    });
    return res.status(200).json(payload);
  }
}
