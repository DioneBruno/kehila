export type BiProps = {
  companyUuid: string;
  uuid: string;
  gateway: string;
  titulo: string;
  descricao: string;
  referencia: { tipo: string; valor: string };
  parametros?: { nome: string; valor: string; obrigatorio: boolean }[];
  roles?: string[];
};

export class BiEntity {
  constructor(readonly props: BiProps) {
    if (!props.parametros) props.parametros = [];
    if (!props.roles) props.roles = [];
  }

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  gateway(): string {
    return this.props.gateway;
  }
  setGateway(gateway: string) {
    this.props.gateway = gateway;
  }
  titulo(): string {
    return this.props.titulo;
  }
  setTitulo(titulo: string) {
    if (!titulo) return;
    this.props.titulo = titulo;
  }
  descricao(): string {
    return this.props.descricao;
  }
  setDescricao(descricao: string) {
    if (!descricao) return;
    this.props.descricao = descricao;
  }
  referencia(): { tipo: string; valor: string } {
    return this.props.referencia;
  }
  setReferencia(referencia: { tipo: string; valor: string }) {
    if (!referencia) return;
    this.props.referencia = referencia;
  }
  parametros(): { nome: string; valor: string; obrigatorio: boolean }[] {
    return this.props.parametros ?? [];
  }
  setParametros(parametros: { nome: string; valor: string; obrigatorio: boolean }[]) {
    if (!parametros) return;
    this.props.parametros = parametros;
  }
  roles(): string[] {
    return this.props.roles ?? [];
  }
  setRoles(roles: string[]) {
    if (!roles) return;
    this.props.roles = roles;
  }
}
