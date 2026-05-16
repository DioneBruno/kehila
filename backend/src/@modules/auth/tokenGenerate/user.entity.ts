export type UserProps = {
  uuid: string;
  cpfCnpj: string;
  name: string;
  email: string;
  password: string;
};

export class UserEntity {
  constructor(readonly props: UserProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  cpfCnpj(): string {
    return this.props.cpfCnpj;
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
}
