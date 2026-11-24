import { ApiJwt } from "src/@modules/shared/apiJwt";

export type CompanyProps = {
  uuid: string;
  name: string;
  cpfCnpj: string;
  modulos?: string[];
};

export type UserProps = {
  company: CompanyProps;
  uuid: string;
  cpf: string;
  name: string;
  email: string;
  position?: string | null;
  roles?: string[] | null;
};

export class UserEntity {
  constructor(readonly props: UserProps) {}

  company(): CompanyProps {
    return this.props.company;
  }
  uuid(): string {
    return this.props.uuid;
  }
  cpf(): string {
    return this.props.cpf;
  }
  name(): string {
    return this.props.name;
  }
  email(): string {
    return this.props.email;
  }
  position(): string | null {
    return this.props.position ?? null;
  }
  roles(): string[] {
    return this.props.roles ?? [];
  }

  tokenGenegate(): any {
    const token = ApiJwt.tokenSigning({
      user: {
        uuid: this.uuid(),
        cpf: this.cpf(),
        name: this.name(),
        email: this.email(),
        position: this.position(),
        roles: this.roles(),
      },
      company: {
        uuid: this.company().uuid,
        name: this.company().name,
        cpfCnpj: this.company().cpfCnpj,
        modulos: this.company().modulos ?? [],
      },
    });
    return token;
  }
}
