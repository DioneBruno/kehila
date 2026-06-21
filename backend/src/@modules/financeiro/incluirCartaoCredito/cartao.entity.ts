import { ContaBancariaEntity } from "./contabancaria.entity";
import { UsuarioEntity } from "./usuario.entity";

export type CartaoProps = {
  companyUuid: string;
  usuario: UsuarioEntity;
  contaBancaria: ContaBancariaEntity;
  nome: string;
  numero: string;
  mesVencimento: string;
  anoVencimento: string;
  codigoSeguranca: string;
  remoteIp?: string;
};

export class CartaoEntity {
  private _numero?: string;
  private _bandeira?: string;
  private _token?: string;

  constructor(readonly props: CartaoProps) {}

  setRegistro(registro: { numero: string; bandeira: string; token: string }): void {
    this._numero = registro.numero;
    this._bandeira = registro.bandeira;
    this._token = registro.token;
  }
  bandeira(): string | undefined {
    return this._bandeira;
  }
  token(): string | undefined {
    return this._token;
  }
  companyUuid(): string {
    return this.props.companyUuid;
  }
  usuario(): UsuarioEntity {
    return this.props.usuario;
  }
  contaBancaria(): ContaBancariaEntity {
    return this.props.contaBancaria;
  }
  nome(): string {
    return this.props.nome;
  }
  numero(): string {
    return this._numero ?? this.props.numero;
  }
  mesVencimento(): string {
    return this.props.mesVencimento;
  }
  anoVencimento(): string {
    return this.props.anoVencimento;
  }
  codigoSeguranca(): string {
    return this.props.codigoSeguranca;
  }
  remoteIp(): string | undefined {
    return this.props.remoteIp;
  }
}
