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
      `SELECT i.uuid, i.pessoa_nome, i.pessoa_documento, i.pessoa_email, i.pessoa_telefone, t.preco, t.gerar_quantidade_ingressos
       FROM evento_ingressos i
       JOIN evento_lote_tipos_ingresso t ON t.uuid = i.tipo_ingresso_uuid
       WHERE i.company_uuid = $1
         AND i.pedido_uuid = $2
       ORDER BY i.index`,
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
          valor: Number(r.preco) / Number(r.gerar_quantidade_ingressos),
        }),
    );
  }

  async criarCobranca(input: {
    pedido: PedidoEntity;
    pagador: PagadorEntity;
    numParcelas: number;
    tipoCobranca?: string;
    cartaoUuid?: string;
  }): Promise<void> {
    const repo = new FinanceiroGerarCobrancaRepository(this.connectionHub);
    const usecase = new GerarCobrancaUsecase(repo);
    const inputGerarCobranca = {
      companyUuid: input.pedido.companyUuid(),
      userUuid: input.pedido.userUuid(),
      origem: "eventoPedido",
      origemUuid: input.pedido.uuid(),
      pagadorNome: input.pagador.nome(),
      numParcelas: input.numParcelas,
      pagadorDocumento: input.pagador.documento(),
      pagadorEmail: input.pagador.email(),
      pagadorTelefone: input.pagador.telefone(),
      valor: input.pedido.valorTotal(),
      tipoCobranca: input.tipoCobranca,
      cartaoUuid: input.cartaoUuid,
    };
    await usecase.execute(inputGerarCobranca);
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

  async atualizarStatusPedidoParaPagamentoGerado(pedidoUuid: string): Promise<void> {
    await this.connectionHub.database!.query(`UPDATE evento_pedidos SET status = 'pagamento_gerado', updated_at = now() WHERE uuid = $1`, [
      pedidoUuid,
    ]);
  }
}
