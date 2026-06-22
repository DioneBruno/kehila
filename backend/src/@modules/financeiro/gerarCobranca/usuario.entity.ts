export type UsuarioProps = {
  uuid: string;
  cartoes: { uuid: string }[];
};

export class UsuarioEntity {
  constructor(readonly props: UsuarioProps) {}

  buscarCartao(cartaoUuid: string) {
    const cartao = this.props.cartoes.find((cartao) => cartao.uuid === cartaoUuid);
    if (!cartao) {
      throw new Error("Cartão não encontrado.");
    }
    return cartao;
  }
}
