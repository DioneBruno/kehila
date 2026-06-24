import { ApiError } from "src/@modules/shared/apiError";

export type UsuarioProps = {
  uuid: string;
  cartoes: { uuid: string; token: string }[];
};

export class UsuarioEntity {
  constructor(readonly props: UsuarioProps) {}

  buscarCartao(cartaoUuid: string): { uuid: string; token: string } {
    const cartao = this.props.cartoes.find((cartao) => cartao.uuid === cartaoUuid);
    if (!cartao) throw new ApiError("Cartão não encontrado", 400);
    return cartao;
  }
}
