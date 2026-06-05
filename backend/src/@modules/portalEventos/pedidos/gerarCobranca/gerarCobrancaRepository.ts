import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PedidoEntity } from "./pedido.entity";
import { GerarCobrancaUsecase } from "src/@modules/financeiro/gerarCobranca/gerarCobranca.usecase";
import { GerarCobrancaRepository as FinanceiroGerarCobrancaRepository } from "src/@modules/financeiro/gerarCobranca/gerarCobrancaRepository";
import { PagadorEntity } from "./pagador.entity";
import { IngressoEntity } from "./ingresso.entity";

export class GerarCobrancaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPedido(companyUuid: string, pedidoUuid: string): Promise<PedidoEntity | null> {
    const [pedidoModel] = await this.connectionHub.database!.query(
      `SELECT
       uuid,
       company_uuid,
       user_uuid,
       valor_bruto,
       valor_desconto,
       valor_liquido
      FROM evento_pedidos
      WHERE company_uuid = $1
        AND uuid = $2`,
      [companyUuid, pedidoUuid],
    );
    if (!pedidoModel) return null;

    const [usuarioModel] = await this.connectionHub.database!.query(`SELECT * FROM auth_users WHERE uuid = $1`, [pedidoModel.user_uuid]);
    const usuario = new PagadorEntity({
      nome: usuarioModel.name,
      documento: usuarioModel.cpf,
      email: usuarioModel.email,
      telefone: usuarioModel.phone,
    });

    const pedido = new PedidoEntity({
      companyUuid: pedidoModel.company_uuid,
      userUuid: pedidoModel.user_uuid,
      uuid: pedidoModel.uuid,
      usuario,
      valorBruno: pedidoModel.valor_bruto,
      valorDesconto: pedidoModel.valor_desconto,
      valorTotal: pedidoModel.valor_liquido,
    });
    return pedido;
  }

  async buscarIngressos(companyUuid: string, pedidoUuid: string): Promise<IngressoEntity[]> {
    const rows = await this.connectionHub.database!.query(
      `SELECT uuid, pessoa_nome, pessoa_documento, pessoa_email, pessoa_telefone
       FROM evento_ingressos
       WHERE company_uuid = $1
         AND pedido_uuid = $2`,
      [companyUuid, pedidoUuid],
    );
    return rows.map(
      (r: any) =>
        new IngressoEntity({
          uuid: r.uuid,
          pessoaNome: r.pessoa_nome,
          pessoaDocumento: r.pessoa_documento,
          pessoaEmail: r.pessoa_email,
          pessoaTelefone: r.pessoa_telefone,
        }),
    );
  }

  async criarCobranca(pedido: PedidoEntity, pagador: PagadorEntity, numParcelas: number): Promise<void> {
    const repo = new FinanceiroGerarCobrancaRepository(this.connectionHub);
    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid: pedido.companyUuid(),
      userUuid: pedido.userUuid(),
      origem: "eventoPedido",
      origemUuid: pedido.uuid(),
      pagadorNome: pagador.nome(),
      numParcelas,
      pagadorDocumento: pagador.documento(),
      pagadorEmail: pagador.email(),
      pagadorTelefone: pagador.telefone(),
      valor: pedido.valorTotal(),
    };
    await usecase.execute(input);
  }

  async criarCobrancaIngresso(pedido: PedidoEntity, ingresso: IngressoEntity, valor: number, numParcelas: number): Promise<void> {
    const repo = new FinanceiroGerarCobrancaRepository(this.connectionHub);
    const usecase = new GerarCobrancaUsecase(repo);
    await usecase.execute({
      companyUuid: pedido.companyUuid(),
      userUuid: pedido.userUuid(),
      origem: "eventoIngresso",
      origemUuid: ingresso.uuid(),
      numParcelas,
      pagadorNome: ingresso.pessoaNome(),
      pagadorDocumento: ingresso.pessoaDocumento(),
      pagadorEmail: ingresso.pessoaEmail(),
      pagadorTelefone: ingresso.pessoaTelefone(),
      valor,
    });
  }
}
