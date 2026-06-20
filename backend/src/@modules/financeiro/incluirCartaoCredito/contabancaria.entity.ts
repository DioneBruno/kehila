export type ContaBancariaProps = {
  uuid: string;
  bancoNumero: string;
  ambiente: "HOMOLOG" | "PROD";
};

export class ContaBancariaEntity {
  constructor(readonly props: ContaBancariaProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  bancoNumero(): string {
    return this.props.bancoNumero;
  }
}
