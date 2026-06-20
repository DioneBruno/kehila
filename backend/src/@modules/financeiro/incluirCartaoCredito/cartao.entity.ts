import { UsuarioEntity } from "./usuario.entity";

export type CartaoProps = {
  companyUuid: string;
  usuario: UsuarioEntity;
  nome: string;
  numero: string;
  mesVencimento: string;
  anoVencimento: string;
  codigoSeguranca: string;
};

export class CartaoEntity {
  constructor(readonly props: CartaoProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  usuario(): UsuarioEntity {
    return this.props.usuario;
  }
  nome(): string {
    return this.props.nome;
  }
  numero(): string {
    return this.props.numero;
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
}
