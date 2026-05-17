import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { TokenGenerateUseCase } from "src/@modules/auth/tokenGenerate/tokenGenerate.usecase";
//
@Controller("")
export class AuthController {
  constructor(readonly tokenGenerateUseCase: TokenGenerateUseCase) {}

  // @ApiOperation({ summary: "Buscar cidades" })
  @Post("token-generate")
  async tokenGenerate(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: body.companyUuid,
      userName: body.userName,
      password: body.password,
    };
    const token = await this.tokenGenerateUseCase.execute(input);
    return res.status(200).json(token);
  }
}
