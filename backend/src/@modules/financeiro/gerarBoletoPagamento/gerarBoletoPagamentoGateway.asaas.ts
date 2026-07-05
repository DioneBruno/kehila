/* eslint-disable no-unsafe-optional-chaining */
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PagamentoEntity } from "./pagamento.entity";
import { ApiError } from "src/@modules/shared/apiError";

const ASAAS_SANDBOX_URL = "https://api-sandbox.asaas.com";
const ASAAS_PROD_URL = "https://api.asaas.com";

export class GerarBoletoPagamentoGatewayAsaas {
  constructor(readonly connectionHub: ConnectionHub) {}

  async gerarBoleto(pagamento: PagamentoEntity): Promise<any> {
    const cliente = await this.buscarCliente(pagamento);
    const { token, baseUrl } = await this.buscarToken(pagamento);

    const url = `${baseUrl}/v3/payments`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const body = {
      externalReference: pagamento.uuid(),
      billingType: "BOLETO", //BOLETO
      customer: cliente.id,
      value: pagamento.valor(),
      dueDate: pagamento.vencimento(),
      description: `Breve descrição para a cobrança`,
      totalValue: pagamento.valor(),
    };

    const responseCobranca = await this.connectionHub.http?.post(url, body, { headers });

    pagamento.setDadosBanco({
      bancoRef: responseCobranca?.data?.id,
      linkBoleto: responseCobranca?.data?.bankSlipUrl,
      valor: responseCobranca?.data?.value,
      valorComDescGateway: responseCobranca?.data?.netValue,
      status: "pendente",
    });
  }

  private async buscarCliente(pagamento: PagamentoEntity): Promise<{ id: string }> {
    const { token, baseUrl } = await this.buscarToken(pagamento);
    const url = `${baseUrl}/v3/customers?cpfCnpj=${pagamento.pagadorDocumento()}`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const response = await this.connectionHub.http?.get(url, { headers });
    if (!response?.data?.data.length) return await this.cadastrarCliente(pagamento);
    return { id: response?.data?.data[0]?.id };
  }

  private async cadastrarCliente(pagamento: PagamentoEntity) {
    const { token, baseUrl } = await this.buscarToken(pagamento);
    const url = `${baseUrl}/v3/customers`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const body = {
      name: pagamento.pagadorNome(),
      cpfCnpj: pagamento.pagadorDocumento(),
      email: pagamento.pagadorEmail(),
      phone: pagamento.pagadorTelefone(),
      notificationDisabled: true,
    };
    await this.connectionHub.http?.post(url, body, { headers });
    return this.buscarCliente(pagamento);
  }

  private async buscarToken(pagamento: PagamentoEntity): Promise<{ token: string; baseUrl: string }> {
    const [contaBancariaModel] = await this.connectionHub.database?.query(
      `SELECT chave_api, ambiente
        FROM financeiro_contas_bancarias
        WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND status = 'ativo'`,
      [pagamento.companyUuid()],
    );
    if (!contaBancariaModel) throw new ApiError("Conta bancária não encontrada", 400);
    const baseUrl = contaBancariaModel.ambiente === "PROD" ? ASAAS_PROD_URL : ASAAS_SANDBOX_URL;
    return { token: contaBancariaModel.chave_api, baseUrl };
  }
}
