type UsuarioProps = {
  uuid: string;
  nome: string;
  email: string;
  cpf: string;
  cep: string;
  endereco: string;
  enderecoNumero: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
};

export class UsuarioEntity {
  constructor(readonly props: UsuarioProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  nome(): string {
    return this.props.nome;
  }
  email(): string {
    return this.props.email;
  }
  cpf(): string {
    return this.props.cpf;
  }
  telefone(): string {
    return this.props.telefone;
  }
  cep(): string {
    return this.props.cep;
  }
  endereco(): string {
    return this.props.endereco;
  }
  enderecoNumero(): string {
    return this.props.enderecoNumero;
  }
  bairro(): string {
    return this.props.bairro;
  }
  cidade(): string {
    return this.props.cidade;
  }
  uf(): string {
    return this.props.uf;
  }
}
