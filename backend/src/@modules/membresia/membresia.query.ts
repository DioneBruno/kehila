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

  async buscarMembro(companyUuid: string, membroUuid: string): Promise<MembroListItem | null> {
    const [membro]: MembroListItem[] = await this.connections.database.query(
      `
      SELECT ${COLUNAS_MEMBRO}
      FROM auth_pessoas
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND uuid = $2
      `,
      [companyUuid, membroUuid],
    );
    return membro ?? null;
  }
}
