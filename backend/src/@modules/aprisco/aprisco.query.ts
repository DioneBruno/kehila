import { ConnectionHub } from "../shared/connections/connectionHub";
import { ApriscoStatus } from "./incluirAprisco/aprisco.entity";

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
}
