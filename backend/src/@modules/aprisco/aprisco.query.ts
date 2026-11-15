import { ConnectionHub } from "../shared/connections/connectionHub";
import { ApriscoStatus } from "./incluirAprisco/aprisco.entity";
import { PapelIntegrante } from "./vincularIntegrante/integrante.entity";

export type ApriscoListItem = {
  uuid: string;
  index: number;
  nome: string;
  horario: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ApriscoStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type IntegranteListItem = {
  uuid: string;
  pessoaUuid: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  papel: PapelIntegrante;
  createdAt: Date;
};

// Ordem de exibição dos papéis: liderança primeiro
const ORDEM_PAPEL = `CASE i.papel WHEN 'LIDER' THEN 1 WHEN 'AUXILIAR' THEN 2 WHEN 'ANFITRIAO' THEN 3 ELSE 4 END`;

// latitude/longitude são decimal no banco; o cast para float8 faz o driver devolver number em vez de string
const COLUNAS_APRISCO = `
        uuid,
        index,
        nome,
        horario,
        endereco,
        latitude::float8 AS latitude,
        longitude::float8 AS longitude,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
`;

export class ApriscoQuery {
  constructor(readonly connections: ConnectionHub) {}

  async listarApriscos(companyUuid: string): Promise<ApriscoListItem[]> {
    return this.connections.database.query(
      `
      SELECT ${COLUNAS_APRISCO}
      FROM apriscos
      WHERE deleted_at IS NULL
        AND company_uuid = $1
      ORDER BY nome ASC
      `,
      [companyUuid],
    );
  }

  async buscarAprisco(companyUuid: string, apriscoUuid: string): Promise<ApriscoListItem | null> {
    const [aprisco]: ApriscoListItem[] = await this.connections.database.query(
      `
      SELECT ${COLUNAS_APRISCO}
      FROM apriscos
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND uuid = $2
      `,
      [companyUuid, apriscoUuid],
    );
    return aprisco ?? null;
  }

  /**
   * Apriscos em que o usuário logado é LIDER.
   * auth_users ↔ auth_pessoas é ligado por CPF ou e-mail na mesma empresa (mesmo critério de MembresiaQuery.buscarMembro).
   */
  async listarApriscosLiderados(companyUuid: string, userUuid: string): Promise<ApriscoListItem[]> {
    return this.connections.database.query(
      `
      SELECT ${COLUNAS_APRISCO}
      FROM apriscos
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND EXISTS (
          SELECT 1
          FROM aprisco_integrantes i
          JOIN auth_pessoas p ON p.uuid = i.pessoa_uuid AND p.deleted_at IS NULL
          JOIN auth_users u ON u.uuid = $2 AND u.deleted_at IS NULL
          WHERE i.deleted_at IS NULL
            AND i.company_uuid = apriscos.company_uuid
            AND i.aprisco_uuid = apriscos.uuid
            AND i.papel = 'LIDER'
            AND (
              (NULLIF(TRIM(p.cpf), '') IS NOT NULL AND u.cpf = TRIM(p.cpf))
              OR (NULLIF(TRIM(p.email), '') IS NOT NULL AND u.email = TRIM(p.email))
            )
        )
      ORDER BY nome ASC
      `,
      [companyUuid, userUuid],
    );
  }

  async listarIntegrantes(companyUuid: string, apriscoUuid: string): Promise<IntegranteListItem[]> {
    return this.connections.database.query(
      `
      SELECT
        i.uuid,
        i.pessoa_uuid AS "pessoaUuid",
        p.nome,
        p.email,
        p.telefone,
        i.papel,
        i.created_at AS "createdAt"
      FROM aprisco_integrantes i
      JOIN auth_pessoas p ON p.uuid = i.pessoa_uuid AND p.deleted_at IS NULL
      WHERE i.deleted_at IS NULL
        AND i.company_uuid = $1
        AND i.aprisco_uuid = $2
      ORDER BY ${ORDEM_PAPEL}, p.nome ASC NULLS LAST
      `,
      [companyUuid, apriscoUuid],
    );
  }
}
