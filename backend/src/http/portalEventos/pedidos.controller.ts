import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CancelarPedidoUsecase } from "src/@modules/portalEventos/pedidos/cancelarPedido/cancelarPedido.usecase";
import { CriarPedidoUsecase } from "src/@modules/portalEventos/pedidos/criarPedido/criarPedido.usecase";
import { EditarFormIngressoUsecase } from "src/@modules/portalEventos/pedidos/editarFormIngresso/editarFormIngresso.usecase";
import { GerarCobrancaUsecase } from "src/@modules/portalEventos/pedidos/gerarCobranca/gerarCobranca.usecase";
import { PortalEventosQuery } from "src/@modules/portalEventos/portalEventos.query";

@Controller("pedidos")
export class PedidosController {
  constructor(
    private readonly portalEventosQuery: PortalEventosQuery,
    private readonly criarPedidoUsecase: CriarPedidoUsecase,
    private readonly gerarCobrancaUsecase: GerarCobrancaUsecase,
    private readonly editarFormIngressoUsecase: EditarFormIngressoUsecase,
    private readonly cancelarPedidoUsecase: CancelarPedidoUsecase,
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

  @Post("gerarCobranca")
  async close(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      userUuid: req.userUuid,
      pedidoUuid: body.pedidoUuid,
      tipoPagador: body.tipoPagador,
      numParcelas: body.numParcelas,
      pagadorNome: body.pagadorNome,
      pagadorDocumento: body.pagadorDocumento,
      pagadorEmail: body.pagadorEmail,
      pagadorTelefone: body.pagadorTelefone,
      tipoCobranca: body.tipoCobranca,
      cartaoCredito: body.cartaoCredito,
    };
    await this.gerarCobrancaUsecase.execute(input);
    return res.status(200).json({ message: "Boleto gerado com sucesso" });
  }

  @Post("listar")
  async list(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      companyUuid: req.companyUuid,
      eventoUuid: body.eventoUuid,
      userUuid: req.userUuid,
    };
    const response = await this.portalEventosQuery.listarPedidosDoUsuario(input);
    return res.status(200).json({ data: response });
  }

  @Post(":pedidoUuid")
  async buscar(@Req() req: Request | any, @Body() body: any, @Param("pedidoUuid") pedidoUuid: string, @Res() res: Response) {
    const response = await this.portalEventosQuery.buscarPedido(pedidoUuid);
    return res.status(200).json(response);
  }

  @Post(":pedidoUuid/cancelar")
  async cancelar(@Req() req: Request | any, @Param("pedidoUuid") pedidoUuid: string, @Res() res: Response) {
    await this.cancelarPedidoUsecase.execute({ pedidoUuid, userUuid: req.userUuid });
    return res.status(200).json({ message: "Pedido cancelado com sucesso" });
  }

  @Post(":pedidoUuid/editar-form-ingresso")
  async editarFormIngresso(@Req() req: Request | any, @Body() body: any, @Res() res: Response) {
    const input = {
      pedidoUuid: body.pedidoUuid,
      ingressoUuid: body.ingressoUuid,
      pessoaNome: body.pessoaNome,
      pessoaDocumento: body.pessoaDocumento,
      pessoaEmail: body.pessoaEmail,
      pessoaTelefone: body.pessoaTelefone,
      pessoaUf: body.pessoaUf,
      pessoaCidade: body.pessoaCidade,
      formData: body.formData,
    } as any;
    await this.editarFormIngressoUsecase.execute(input);
    return res.status(200).json({ message: "Formulário do ingresso editado com sucesso" });
  }
}
