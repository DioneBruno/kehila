export type ContaBancariaProps = {
  uuid: string;
  companyUuid: string;
  nome: string | null;
  bancoNumero: string | null;
  agencia: string | null;
  conta: string | null;
  digito: string | null;
  chaveApi: string | null;
  status: string | null;
};

export class ContaBancariaEntity {
  constructor(readonly props: ContaBancariaProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  companyUuid(): string {
    return this.props.companyUuid;
  }
  nome(): string | null {
    return this.props.nome;
  }
  bancoNumero(): string | null {
    return this.props.bancoNumero;
  }
  agencia(): string | null {
    return this.props.agencia;
  }
  conta(): string | null {
    return this.props.conta;
  }
  digito(): string | null {
    return this.props.digito;
  }
  chaveApi(): string | null {
    return this.props.chaveApi;
  }
  status(): string | null {
    return this.props.status;
  }
}
