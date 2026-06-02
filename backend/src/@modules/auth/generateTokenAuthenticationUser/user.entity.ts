import { ApiJwt } from "src/@modules/shared/apiJwt";

export type CompanyProps = {
  uuid: string;
  name: string;
  cpfCnpj: string;
};

export type UserProps = {
  company: CompanyProps;
  uuid: string;
  cpf: string;
  name: string;
  email: string;
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

  tokenGenegate(): any {
    const token = ApiJwt.tokenSigning({
      user: {
        uuid: this.uuid(),
        cpfCnpj: this.cpf(),
        name: this.name(),
        email: this.email(),
      },
      company: {
        uuid: this.company().uuid,
        name: this.company().name,
        cpfCnpj: this.company().cpfCnpj,
      },
    });
    return token;
  }
}
