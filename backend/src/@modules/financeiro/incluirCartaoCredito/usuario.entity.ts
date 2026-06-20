type UsuarioProps = {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  cep: string;
  endereco: string;
  enderecoNumero: string;
  bairro: string;
  telefone: string;
};

export class UsuarioEntity {
  constructor(readonly props: UsuarioProps) {}

  uuid(): string {
    return this.props.uuid;
  }
}
