import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type UsuarioDetalhe = {
  uuid: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  cep: string | null;
  endereco: string | null;
  enderecoNumero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  estadoCivil: string | null;
  dataNascimento: string | null;
  meta: { batizado?: boolean; outraIgreja?: boolean };
  position: string | null;
  roles: string[];
  isAccepted: boolean;
  isVerify: boolean;
  createdAt: string;
  updatedAt: string;
  randomCode: string[];
};

export class DetalharUsuarioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPorUuid(companyUuid: string, usuarioUuid: string): Promise<UsuarioDetalhe | null> {
    const [row] = await this.connectionHub.database!.query(
      `
      SELECT
        u.uuid,
        u.name,
        u.cpf,
        u.email,
        u.phone,
        u.cep,
        u.endereco,
        u.endereco_numero AS "enderecoNumero",
        u.bairro,
        u.cidade,
        u.uf,
        u.estado_civil AS "estadoCivil",
        TO_CHAR(u.data_nascimento, 'YYYY-MM-DD') AS "dataNascimento",
        u.meta,
        uc.position,
        uc.roles,
        uc.is_accepted AS "isAccepted",
        u.is_verify AS "isVerify",
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt"
      FROM auth_users u
        INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
      WHERE u.deleted_at IS NULL
        AND uc.deleted_at IS NULL
        AND uc.company_uuid = $1
        AND u.uuid = $2
      `,
      [companyUuid, usuarioUuid],
    );

    if (!row) return null;

    const randomCode = [];
    const tokensAcessoCpf = `auth_random_code:${companyUuid}:${row.cpf}`;
    const tokensCpf = await this.connectionHub.cache!.findKey(tokensAcessoCpf);
    if (tokensCpf) randomCode.push(tokensCpf.code);
    const tokensAcessoEmail = `auth_random_code:${companyUuid}:${row.email}`;
    const tokensEmail = await this.connectionHub.cache!.findKey(tokensAcessoEmail);
    if (tokensEmail) randomCode.push(tokensEmail.code);

    return {
      uuid: row.uuid,
      name: row.name,
      cpf: row.cpf,
      email: row.email,
      phone: row.phone,
      cep: row.cep,
      endereco: row.endereco,
      enderecoNumero: row.enderecoNumero,
      bairro: row.bairro,
      cidade: row.cidade,
      uf: row.uf,
      estadoCivil: row.estadoCivil,
      dataNascimento: row.dataNascimento,
      meta: row.meta ?? {},
      position: row.position,
      roles: row.roles,
      isAccepted: row.isAccepted,
      isVerify: row.isVerify,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      randomCode,
    };
  }
}
