import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type CriarLoteData = {
  companyUuid: string;
  eventoUuid: string;
  nome: string;
  ordem: number;
  quantidade: number;
  preco: number;
  dataInicio?: string;
  dataFim?: string;
  ativo: boolean;
};

export type LoteCriado = {
  uuid: string;
};

export class CriarLoteRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async eventoExiste(eventoUuid: string, companyUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(`SELECT uuid FROM eventos WHERE uuid = $1 AND company_uuid = $2`, [
      eventoUuid,
      companyUuid,
    ]);
    return !!row;
  }

  async proximaOrdem(eventoUuid: string): Promise<number> {
    const [row] = await this.connectionHub.database!.query(`SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM evento_lotes WHERE evento_uuid = $1`, [
      eventoUuid,
    ]);
    return row.proxima;
  }

  async criar(data: CriarLoteData): Promise<LoteCriado> {
    const [row] = await this.connectionHub.database!.query(
      `
      INSERT INTO evento_lotes (
        company_uuid, evento_uuid, nome, ordem, quantidade, preco, data_inicio, data_fim, ativo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING uuid
      `,
      [
        data.companyUuid,
        data.eventoUuid,
        data.nome,
        data.ordem,
        data.quantidade,
        data.preco,
        data.dataInicio ?? null,
        data.dataFim ?? null,
        data.ativo,
      ],
    );
    return row;
  }
}
