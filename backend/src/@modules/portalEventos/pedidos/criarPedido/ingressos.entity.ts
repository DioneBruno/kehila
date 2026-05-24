export type IngessoProps = {
  uuid: string;
  codigo: string;
  tipoIngressoUuid: string;
};

export class IngressosEntity {
  constructor(readonly props: IngessoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  codigo(): string {
    return this.props.codigo;
  }
  tipoIngressoUuid(): string {
    return this.props.tipoIngressoUuid;
  }
}
