export type UsuarioProps = {
  uuid: string;
  companyUuid: string;
  cpf: string;
  name: string;
  email?: string;
  phone?: string;
  roles?: string[];
};

export class UsuarioEntity {
  constructor(readonly props: UsuarioProps) {
    if (!props.roles) props.roles = ["usuario-externo"];
  }

  uuid(): string {
    return this.props.uuid;
  }

  companyUuid(): string {
    return this.props.companyUuid;
  }
  cpf(): string {
    return this.props.cpf;
  }
  name(): string {
    return this.props.name;
  }
  email(): string | null {
    return this.props.email ?? null;
  }
  phone(): string | null {
    return this.props.phone ?? null;
  }

  roles(): string[] {
    return this.props.roles ?? ["usuario-externo"];
  }
}
