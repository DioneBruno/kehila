import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type EditarEventoData = {
  titulo?: string;
  descricao?: string;
  bannerUrl?: string;
  dataInicio?: string;
  dataFim?: string;
  capacidadeTotal?: number;
  localNome?: string;
  localEndereco?: string;
  localLat?: number;
  localLng?: number;
  online?: boolean;
  linkOnline?: string;
  status?: string;
};

export class EditarEventoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarStatus(companyUuid: string, eventoUuid: string): Promise<string | null> {
    const [row] = await this.connectionHub.database.query(`SELECT status FROM eventos WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`, [
      eventoUuid,
      companyUuid,
    ]);
    return row?.status ?? null;
  }

  async atualizar(companyUuid: string, eventoUuid: string, data: EditarEventoData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    const mapeamento: Record<string, string> = {
      titulo: "titulo",
      descricao: "descricao",
      bannerUrl: "banner_url",
      dataInicio: "data_inicio",
      dataFim: "data_fim",
      capacidadeTotal: "capacidade_total",
      localNome: "local_nome",
      localEndereco: "local_endereco",
      localLat: "local_lat",
      localLng: "local_lng",
      online: "online",
      linkOnline: "link_online",
      status: "status",
    };

    for (const [chave, coluna] of Object.entries(mapeamento)) {
      if (chave in data && (data as any)[chave] !== undefined) {
        campos.push(`${coluna} = $${idx}`);
        valores.push((data as any)[chave]);
        idx++;
      }
    }

    if (campos.length === 0) return;

    campos.push(`updated_at = now()`);
    valores.push(eventoUuid, companyUuid);

    await this.connectionHub.database.query(`UPDATE eventos SET ${campos.join(", ")} WHERE uuid = $${idx} AND company_uuid = $${idx + 1}`, valores);
  }
}
