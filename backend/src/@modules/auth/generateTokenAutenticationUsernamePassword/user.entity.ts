import * as bcryptjs from "bcryptjs";
import { ApiError } from "src/@modules/shared/apiError";

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
  password: string;
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
  password(): string {
    return this.props.password;
  }

  async checkPassword(password: string) {
    const passwordMatch = await bcryptjs.compare(password, this.props.password);
    if (!passwordMatch) throw new ApiError("Credenciais inválidas", 401);
  }
}
