import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { CartaoEntity } from "./cartao.entity";
import { ApiError } from "src/@modules/shared/apiError";

const ASAAS_SANDBOX_URL = "https://api-sandbox.asaas.com";
const ASAAS_PROD_URL = "https://api.asaas.com";

export class IncluirCartaoCreditoGatewayAsaas {
  constructor(readonly connectionHub: ConnectionHub) {}

  async registrarCartao(cartaoCredito: CartaoEntity): Promise<{ numeroCartao: string; bandeira: string; token: string }> {
    try {
      const { token, baseUrl } = await this.buscarToken(cartaoCredito);
      const cliente = await this.buscarCliente(cartaoCredito, token, baseUrl);

      const url = `${baseUrl}/v3/creditCard/tokenizeCreditCard`;
      const headers = {
        accept: "application/json",
        "User-Agent": "NomeDaSuaAplicacao/1.0.0",
        "content-type": "application/json",
        access_token: token,
      };
      const usuario = cartaoCredito.usuario();
      const body = {
        customer: cliente.id,
        creditCard: {
          holderName: cartaoCredito.nome(),
          number: cartaoCredito.numero(),
          expiryMonth: cartaoCredito.mesVencimento(),
          expiryYear: cartaoCredito.anoVencimento(),
          ccv: cartaoCredito.codigoSeguranca(),
        },
        creditCardHolderInfo: {
          name: usuario.nome(),
          email: usuario.email(),
          cpfCnpj: usuario.cpf(),
          postalCode: usuario.cep(),
          addressNumber: usuario.enderecoNumero(),
          phone: usuario.telefone(),
        },
        remoteIp: cartaoCredito.remoteIp(),
      };
      const response = await this.connectionHub.http?.post(url, body, { headers });

      return {
        numeroCartao: response?.data?.creditCardNumber,
        bandeira: response?.data?.creditCardBrand,
        token: response?.data?.creditCardToken,
      };
    } catch (error: any) {
      console.log(error.response?.data);
      throw new ApiError(error.response?.data?.errors[0].description, 400);
    }
  }

  private async buscarCliente(cartaoCredito: CartaoEntity, token: string, baseUrl: string): Promise<{ id: string }> {
    const usuario = cartaoCredito.usuario();
    const url = `${baseUrl}/v3/customers?cpfCnpj=${usuario.cpf()}`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const response = await this.connectionHub.http?.get(url, { headers });
    if (!response?.data?.data.length) return await this.cadastrarCliente(cartaoCredito, token, baseUrl);
    return response?.data?.data[0];
  }

  private async cadastrarCliente(cartaoCredito: CartaoEntity, token: string, baseUrl: string): Promise<{ id: string }> {
    const usuario = cartaoCredito.usuario();
    const url = `${baseUrl}/v3/customers`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const body = {
      name: usuario.nome(),
      cpfCnpj: usuario.cpf(),
      email: usuario.email(),
      phone: usuario.telefone(),
      notificationDisabled: true,
    };
    await this.connectionHub.http?.post(url, body, { headers });
    return this.buscarCliente(cartaoCredito, token, baseUrl);
  }

  private async buscarToken(cartaoCredito: CartaoEntity): Promise<{ token: string; baseUrl: string }> {
    const [contaBancariaModel] = await this.connectionHub.database?.query(
      `SELECT chave_api, ambiente FROM financeiro_contas_bancarias WHERE deleted_at IS NULL AND company_uuid = $1 AND status = 'ativo'`,
      [cartaoCredito.companyUuid()],
    );
    if (!contaBancariaModel) throw new ApiError("Conta bancária não encontrada", 400);
    const baseUrl = contaBancariaModel.ambiente === "PROD" ? ASAAS_PROD_URL : ASAAS_SANDBOX_URL;
    return { token: contaBancariaModel.chave_api, baseUrl };
  }
}
