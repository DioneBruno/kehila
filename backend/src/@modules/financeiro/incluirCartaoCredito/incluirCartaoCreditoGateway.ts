import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { CartaoEntity } from "./cartao.entity";

export class IncluirCartaoCreditoGateway {
  constructor(readonly connectionHub: ConnectionHub) {}

  async registrarCartao(cartaoCredito: CartaoEntity): Promise<{ numeroCartao: string; bandeira: string; token: string }> {
    return {
      numeroCartao: "1234567890123456",
      bandeira: "VISA",
      token: "1234567890123456",
    };
  }
}
