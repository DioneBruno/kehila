import { randomUUID } from "crypto";
import { PagamentoEntity } from "./pagamento.entity";
import { ApiDate } from "src/@modules/shared/apiDate";

export type PrimeiraParcelaCartao = {
  bancoRef: string;
  valor: number;
  valorComDescGateway: number;
  status: string;
  vencimento: string;
};

export type CartaoCreditoProps = {
  cartaoUuid?: string;
  token?: string;
  nomeNoCartao?: string;
  numeroCartao?: string;
  mesVencimento?: string;
  anoVencimento?: string;
  codigoSeguranca?: string;
};

export type CobrancaProps = {
  companyUuid: string;
  uuid: string;
  userUuid: string;
  pagadorNome: string;
  pagadorDocumento: string;
  pagadorEmail: string;
  pagadorTelefone: string;
  origem: string;
  origemUuid: string;
  valor: number;
  vencimento?: string;
  numParcelas?: number;
  tipoCobranca?: string;
  cartaoCredito?: CartaoCreditoProps;
};

export class CobrancaEntity {
  private _bancoRef?: string;

  constructor(readonly props: CobrancaProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  userUuid(): string {
    return this.props.userUuid;
  }
  tipoCobranca(): string {
    return this.props.tipoCobranca ?? "boleto";
  }
  cartaoCredito(): CartaoCreditoProps | undefined {
    return this.props.cartaoCredito;
  }
  pagador(): { nome: string; documento: string; email: string; telefone: string } {
    return {
      nome: this.props.pagadorNome,
      documento: this.props.pagadorDocumento,
      email: this.props.pagadorEmail,
      telefone: this.props.pagadorTelefone,
    };
  }
  pagadorNome(): string {
    return this.props.pagadorNome;
  }
  pagadorDocumento(): string {
    return this.props.pagadorDocumento;
  }
  pagadorEmail(): string {
    return this.props.pagadorEmail;
  }
  pagadorTelefone(): string {
    return this.props.pagadorTelefone;
  }
  origem(): string {
    return this.props.origem;
  }
  origemUuid(): string {
    return this.props.origemUuid;
  }
  valor(): number {
    return this.props.valor;
  }
  vencimento(): string | undefined {
    return this.props.vencimento;
  }
  totalParcelas(): number {
    return this.props.numParcelas ?? 1;
  }
  setBancoRef(ref: string): void {
    this._bancoRef = ref;
  }
  bancoRef(): string | undefined {
    return this._bancoRef;
  }
  geraCartaoPagamentos(primeiraParcela: PrimeiraParcelaCartao): PagamentoEntity[] {
    const totalParcelas = this.totalParcelas();
    const pagamentos = [
      new PagamentoEntity({
        uuid: randomUUID(),
        bancoRef: primeiraParcela.bancoRef,
        vencimento: primeiraParcela.vencimento,
        nossoNumero: "",
        pix: "",
        linkBoleto: "",
        codigoBarras: "",
        linhaDigitavel: "",
        valor: primeiraParcela.valor,
        valorComDescGateway: primeiraParcela.valorComDescGateway,
        valorPago: primeiraParcela.valor,
        status: primeiraParcela.status,
      }),
    ];
    for (let i = 1; i < totalParcelas; i++) {
      const isUltimaParcela = i === totalParcelas - 1;
      const valor = isUltimaParcela ? Math.round((this.valor() - primeiraParcela.valor * (totalParcelas - 1)) * 100) / 100 : primeiraParcela.valor;
      pagamentos.push(
        new PagamentoEntity({
          uuid: randomUUID(),
          vencimento: ApiDate.addMonth(primeiraParcela.vencimento, i, "YYYY-MM-DD"),
          nossoNumero: "",
          pix: "",
          linkBoleto: "",
          codigoBarras: "",
          linhaDigitavel: "",
          valor,
          valorComDescGateway: 0,
          valorPago: 0,
          status: "pendente",
        }),
      );
    }
    return pagamentos;
  }
}
