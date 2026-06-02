import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CriarPedidoUsecase } from "src/@modules/portalEventos/pedidos/criarPedido/criarPedido.usecase";
import { FecharPedidoUsecase } from "src/@modules/portalEventos/pedidos/fecharPedido/fecharPedido.usecase";

@Controller("pedidos")
export class PedidosController {
  constructor(
    private readonly criarPedidoUsecase: CriarPedidoUsecase,
    private readonly fecharPedidoUsecase: FecharPedidoUsecase,
  ) {}

  @Post("criar")
  async create(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      userUuid: req.userUuid,
      eventoUuid: body.eventoUuid,
      pedido: body.pedido,
    };
    const response = await this.criarPedidoUsecase.execute(input);
    return res.status(200).json({ message: "Pedido criado com sucesso", data: { ...response } });
  }

  @Post("fechar")
  async close(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      userUuid: req.userUuid,
      pedidoUuid: body.pedidoUuid,
      pagadorAvulso: body.pagadorAvulso,
      pagadorNome: body.pagadorNome,
      pagadorDocumento: body.pagadorDocumento,
      pagadorEmail: body.pagadorEmail,
      pagadorTelefone: body.pagadorTelefone,
    };
    return await this.fecharPedidoUsecase.execute(input);
  }
}
