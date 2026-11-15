import { ConnectionHub } from "../shared/connections/connectionHub";

export type MembroListItem = {
  uuid: string;
  nome: string | null;
  ativo: boolean;
  membro: boolean;
  batizado: boolean;
  transferido: boolean;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  estadoCivil: string | null;
  dataNascimento: string | null;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  meta: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

export type MembroDetalhe = MembroListItem & {
  /** Usuário de acesso (auth_users) vinculado à empresa com o mesmo CPF/e-mail do membro. */
  usuarioUuid: string | null;
};

const COLUNAS_MEMBRO = `
        uuid,
        nome,
        ativo,
        membro,
        batizado,
        transferido,
        cpf,
        email,
        telefone,
        estado_civil AS "estadoCivil",
        TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS "dataNascimento",
        endereco_cep AS "enderecoCep",
        endereco_logradouro AS "enderecoLogradouro",
        endereco_numero AS "enderecoNumero",
        endereco_complemento AS "enderecoComplemento",
        endereco_bairro AS "enderecoBairro",
        endereco_cidade AS "enderecoCidade",
        endereco_uf AS "enderecoUf",
        COALESCE(meta, '{}'::json) AS meta,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
`;

export type VinculoListItem = {
  uuid: string;
  tipo: string;
  membroVinculadoUuid: string;
  membroVinculadoNome: string | null;
  createdAt: Date;
};

export class MembresiaQuery {
  constructor(readonly connections: ConnectionHub) {}

  async listarMembros(companyUuid: string): Promise<MembroListItem[]> {
    return this.connections.database.query(
      `
      SELECT ${COLUNAS_MEMBRO}
      FROM auth_pessoas
      WHERE deleted_at IS NULL
        AND company_uuid = $1
      ORDER BY nome ASC NULLS LAST
      `,
      [companyUuid],
    );
  }

  async buscarMembro(companyUuid: string, membroUuid: string): Promise<MembroDetalhe | null> {
    const [membro]: MembroDetalhe[] = await this.connections.database.query(
      `
      SELECT ${COLUNAS_MEMBRO},
        (
          SELECT u.uuid
          FROM auth_users u
            INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
          WHERE u.deleted_at IS NULL
            AND uc.deleted_at IS NULL
            AND uc.company_uuid = auth_pessoas.company_uuid
            AND (
              (NULLIF(TRIM(auth_pessoas.cpf), '') IS NOT NULL AND u.cpf = TRIM(auth_pessoas.cpf))
              OR (NULLIF(TRIM(auth_pessoas.email), '') IS NOT NULL AND u.email = TRIM(auth_pessoas.email))
            )
          LIMIT 1
        ) AS "usuarioUuid"
      FROM auth_pessoas
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND uuid = $2
      `,
      [companyUuid, membroUuid],
    );
    return membro ?? null;
  }

  /** Lista os vínculos do membro. Cada item lê-se: "membroVinculado é <tipo> do membro". */
  async listarVinculos(companyUuid: string, membroUuid: string): Promise<VinculoListItem[]> {
    return this.connections.database.query(
      `
      SELECT
        v.uuid,
        v.tipo,
        v.pessoa_vinculada_uuid AS "membroVinculadoUuid",
        p.nome AS "membroVinculadoNome",
        v.created_at AS "createdAt"
      FROM auth_pessoas_vinculos v
      JOIN auth_pessoas p ON p.uuid = v.pessoa_vinculada_uuid AND p.deleted_at IS NULL
      WHERE v.company_uuid = $1
        AND v.pessoa_uuid = $2
      ORDER BY v.tipo ASC, p.nome ASC NULLS LAST
      `,
      [companyUuid, membroUuid],
    );
  }
}
