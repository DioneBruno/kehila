import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ApriscoStatus, DiaSemana } from "../incluirAprisco/aprisco.entity";

export type AlterarApriscoData = {
  nome?: string;
  diaSemana?: DiaSemana | null;
  horario?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: ApriscoStatus;
};

const COLUNAS: Record<keyof AlterarApriscoData, string> = {
  nome: "nome",
  diaSemana: "dia_semana",
  horario: "horario",
  endereco: "endereco",
  latitude: "latitude",
  longitude: "longitude",
  status: "status",
};

export class AlterarApriscoRepository {
  constructor(readonly connections: ConnectionHub) {}

  async existe(companyUuid: string, apriscoUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(`SELECT uuid FROM apriscos WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
      companyUuid,
      apriscoUuid,
    ]);
    return !!row;
  }

  async alterar(companyUuid: string, apriscoUuid: string, data: AlterarApriscoData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];

    for (const [chave, coluna] of Object.entries(COLUNAS)) {
      const valor = (data as any)[chave];
      if (valor === undefined) continue;
      valores.push(valor);
      campos.push(`${coluna} = $${valores.length}`);
    }

    if (campos.length === 0) return;

    campos.push(`updated_at = now()`);
    valores.push(companyUuid, apriscoUuid);

    await this.connections.database.query(
      `UPDATE apriscos SET ${campos.join(", ")} WHERE deleted_at IS NULL AND company_uuid = $${valores.length - 1} AND uuid = $${valores.length}`,
      valores,
    );
  }
}
