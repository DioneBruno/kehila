export type IngressoProps = {
  uuid: string;
  companyUuid: string;
  eventoUuid: string;
  tipoIngressoUuid: string;
  pedidoUuid: string;
  formDataValido: boolean;
  pessoaNome?: string;
  pessoaDocumento?: string;
  pessoaEmail?: string;
  pessoaTelefone?: string;
  pessoaPais?: string;
  pessoaUf?: string;
  pessoaCidade?: string;
  formData?: any;
};

export class IngressoEntity {
  constructor(readonly props: IngressoProps) {}
  uuid(): string {
    return this.props.uuid;
  }
  companyUuid(): string {
    return this.props.companyUuid;
  }
  eventoUuid(): string {
    return this.props.eventoUuid;
  }
  tipoIngressoUuid(): string {
    return this.props.tipoIngressoUuid;
  }
  pedidoUuid(): string {
    return this.props.pedidoUuid;
  }
  formDataValido(): boolean {
    return this.props.formDataValido;
  }
  pessoaNome(): string | undefined {
    return this.props.pessoaNome;
  }
  pessoaDocumento(): string | undefined {
    return this.props.pessoaDocumento;
  }
  pessoaEmail(): string | undefined {
    return this.props.pessoaEmail;
  }
  pessoaTelefone(): string | undefined {
    return this.props.pessoaTelefone;
  }
  pessoaPais(): string | undefined {
    return this.props.pessoaPais;
  }
  pessoaUf(): string | undefined {
    return this.props.pessoaUf;
  }
  pessoaCidade(): string | undefined {
    return this.props.pessoaCidade;
  }
  formData(): object | undefined {
    return this.props.formData ?? {};
  }
  checkDadosObrigatoriosPreenchidos(): boolean {
    return (
      !!this.props.pessoaNome &&
      !!this.props.pessoaDocumento &&
      !!this.props.pessoaEmail &&
      !!this.props.pessoaTelefone &&
      !!this.props.pessoaUf &&
      !!this.props.pessoaCidade &&
      !!this.props.formData?.dataNascimento &&
      !!this.props.formData?.distrito &&
      !!this.props.formData?.temDeficienciaOuRestricao
    );
  }

  setData(data: {
    pessoaNome?: string;
    pessoaDocumento?: string;
    pessoaEmail?: string;
    pessoaTelefone?: string;
    pessoaPais?: string;
    pessoaUf?: string;
    pessoaCidade?: string;
    formData?: object;
  }) {
    this.props.pessoaNome = data.pessoaNome;
    this.props.pessoaDocumento = data.pessoaDocumento;
    this.props.pessoaEmail = data.pessoaEmail;
    this.props.pessoaTelefone = data.pessoaTelefone;
    this.props.pessoaPais = data.pessoaPais;
    this.props.pessoaUf = data.pessoaUf;
    this.props.pessoaCidade = data.pessoaCidade;
    this.props.formData = data.formData;
    this.props.formDataValido = this.checkDadosObrigatoriosPreenchidos();
  }
}
