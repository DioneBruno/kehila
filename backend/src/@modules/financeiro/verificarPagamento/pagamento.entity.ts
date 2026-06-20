export type PagamentoProps = {
  companyUuid: string;
  uuid: string;
  status: string;
};

export class PagamentoEntity {
  constructor(readonly props: PagamentoProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  status(): string {
    return this.props.status;
  }
}
