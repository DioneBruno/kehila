export type TipoIngressoProps = {
  uuid: string;
  nome: string;
  quantidade: number;
  vendidos: number;
  preco: number;
  loteUuid: string;
  gerarQuantidadeIngressos: number;
};

export class TipoIngressoEntity {
  constructor(readonly props: TipoIngressoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  nome(): string {
    return this.props.nome;
  }
  quantidade(): number {
    return this.props.quantidade;
  }
  vendidos(): number {
    return this.props.vendidos ?? 0;
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
  temVagaDisponivel(quantidadeDesejada: number): boolean {
    if (this.props.quantidade === 0) return true;
    return this.vendidos() + quantidadeDesejada <= this.props.quantidade;
  }
}
