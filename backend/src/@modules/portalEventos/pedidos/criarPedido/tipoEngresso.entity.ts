export type TipoEngressoProps = {
  uuid: string;
  nome: string;
  quantidade: number;
  preco: number;
  loteUuid: string;
  gerarQuantidadeIngressos: number;
};

export class TipoEngressoEntity {
  constructor(readonly props: TipoEngressoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  nome(): string {
    return this.props.nome;
  }
  quantidade(): number {
    return this.props.quantidade;
  }
  preco(): number {
    return this.props.preco;
  }
  loteUuid(): string {
    return this.props.loteUuid;
  }
  gerarQuantidadeIngressos(): number {
    return this.props.gerarQuantidadeIngressos ?? 1;
  }
}
