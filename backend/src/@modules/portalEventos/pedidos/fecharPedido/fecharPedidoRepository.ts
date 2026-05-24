import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { PedidoEntity } from "./pedido.entity";
import { GerarCobrancaUsecase } from "src/@modules/financeiro/gerarCobranca/gerarCobranca.usecase";
import { GerarCobrancaRepository } from "src/@modules/financeiro/gerarCobranca/gerarCobrancaRepository";
import { PagadorEntity } from "./pagador.entity";

export class FecharPedidoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPedido(companyUuid: string, pedidoUuid: string): Promise<PedidoEntity | null> {
    const [pedidoModel] = await this.connectionHub.database.query(
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

    const pedido = new PedidoEntity({
      companyUuid: pedidoModel.company_uuid,
      userUuid: pedidoModel.user_uuid,
      uuid: pedidoModel.uuid,
      valorBruno: pedidoModel.valor_bruto,
      valorDesconto: pedidoModel.valor_desconto,
      valorTotal: pedidoModel.valor_total,
    });
    return pedido;
  }

  async criarCobranca(pedido: PedidoEntity, pagador: PagadorEntity): Promise<void> {
    const repo = new GerarCobrancaRepository(this.connectionHub);
    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid: pedido.companyUuid(),
      userUuid: pedido.userUuid(),
      origem: "eventoPedido",
      origemUuid: pedido.uuid(),
      pagadorNome: pagador.nome(),
      pagadorDocumento: pagador.documento(),
      pagadorEmail: pagador.email(),
      pagadorTelefone: pagador.telefone(),
      valor: pedido.valorTotal(),
    };
    await usecase.execute(input);
  }
}
