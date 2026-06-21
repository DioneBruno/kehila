import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { DecoderTokenAuthenticationUsecase } from "src/@modules/auth/decoderTokenAuthentication/decoderTokenAuthentication.uscase";
import { UsuarioQuery } from "src/@modules/usuario/usuario.query";

@Controller("auth")
export class UserController {
  constructor(
    readonly usuarioQuery: UsuarioQuery,
    readonly decoderTokenAuthenticationUsecase: DecoderTokenAuthenticationUsecase,
  ) {}

  @Post("me")
  async me(@Req() req: Request | any, @Res() res: Response) {
    const input = {
      token: req?.headers?.authorization?.slice(7),
    };
    const payload = await this.decoderTokenAuthenticationUsecase.execute(input);
    const usuario = await this.usuarioQuery.buscarUsuarioPorUuid(payload.user.uuid);
    payload.user = { ...payload.user, ...usuario };
    return res.status(200).json(payload);
  }

  @Post("editar-perfil")
  async editarPerfil(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      uuid: req.userUuid,
      nome: body.nome,
      cpf: body.cpf,
      email: body.email,
      telefone: body.telefone,
      cep: body.cep,
      endereco: body.endereco,
      enderecoNumero: body.enderecoNumero,
      bairro: body.bairro,
      cidade: body.cidade,
      uf: body.uf,
    };
    const usuario = await this.usuarioQuery.editarPerfilUsuario(input);
    return res.status(200).json({ message: "Perfil atualizado com sucesso", user: usuario });
  }
}
