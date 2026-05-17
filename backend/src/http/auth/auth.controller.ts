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
      companyUuid: "3ec4dd3b-e3ea-4f44-9a19-04213f64f3b5",
      userName: "",
      password: "",
    };
    const token = this.tokenGenerateUseCase.execute(input);

    return res.status(200).json(token);
  }
}
