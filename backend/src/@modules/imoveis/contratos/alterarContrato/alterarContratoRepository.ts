import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ContratoStatus, GarantiaTipo, IndiceReajuste } from "../../shared/imoveis.tipos";
import { MSG_CONTRATO_NAO_ENCONTRADO, MSG_CONTRATO_NAO_VIGENTE, MSG_FIADOR_NAO_ENCONTRADO } from "../contrato.entity";

export type ContratoParaAlterar = {
  status: ContratoStatus;
  inquilinoUuid: string;
  inicio: string;
  fim: string;
  indiceReajuste: IndiceReajuste;
  mesReajuste: number | null;
  garantiaTipo: GarantiaTipo;
  fiadorUuid: string | null;
};

/** Chaves já são nomes de coluna; valores undefined são ignorados. fim, valor_aluguel, status, imóvel e inquilino ficam de fora. */
export type AlterarContratoColunas = Partial<{
  numero: string | null;
  inicio: string;
  dia_vencimento: number;
  indice_reajuste: IndiceReajuste;
  mes_reajuste: number | null;
  multa_atraso_pct: number;
  juros_mes_pct: number;
  desconto_pontualidade_pct: number | null;
  multa_rescisoria_meses: number | null;
  garantia_tipo: GarantiaTipo;
  garantia_valor: number | null;
  fiador_uuid: string | null;
  observacoes: string | null;
}>;

const COLUNAS_PERMITIDAS = [
  "numero",
  "inicio",
  "dia_vencimento",
  "indice_reajuste",
  "mes_reajuste",
  "multa_atraso_pct",
  "juros_mes_pct",
  "desconto_pontualidade_pct",
  "multa_rescisoria_meses",
  "garantia_tipo",
  "garantia_valor",
  "fiador_uuid",
  "observacoes",
];

export class AlterarContratoRepository {
  constructor(readonly connections: ConnectionHub) {}

  /** Trava o contrato (FOR UPDATE), exige vigente, deixa `montar` decidir as colunas e grava; liga eh_fiador de um fiador novo. */
  async alterar(companyUuid: string, uuid: string, montar: (atual: ContratoParaAlterar) => AlterarContratoColunas): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      const [atual]: ContratoParaAlterar[] = await manager.query(
        `SELECT status, inquilino_uuid AS "inquilinoUuid", TO_CHAR(inicio, 'YYYY-MM-DD') AS inicio, TO_CHAR(fim, 'YYYY-MM-DD') AS fim,
                indice_reajuste AS "indiceReajuste", mes_reajuste AS "mesReajuste", garantia_tipo AS "garantiaTipo", fiador_uuid AS "fiadorUuid"
         FROM imovel_contratos WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL FOR UPDATE`,
        [uuid, companyUuid],
      );
      if (!atual) throw new ApiError(MSG_CONTRATO_NAO_ENCONTRADO, 404);
      if (atual.status !== "vigente") throw new ApiError(MSG_CONTRATO_NAO_VIGENTE, 409);

      const data = montar(atual);

      if (data.fiador_uuid && data.fiador_uuid !== atual.fiadorUuid) {
        // UPDATE ... RETURNING no TypeORM/pg devolve [linhas, quantidade]
        const [fiadores] = await manager.query(
          `UPDATE imovel_pessoas SET eh_fiador = true, updated_at = now()
           WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 RETURNING uuid`,
          [companyUuid, data.fiador_uuid],
        );
        if (!fiadores?.length) throw new ApiError(MSG_FIADOR_NAO_ENCONTRADO, 404);
      }

      const campos: string[] = [];
      const valores: unknown[] = [];
      for (const coluna of COLUNAS_PERMITIDAS) {
        const valor = (data as any)[coluna];
        if (valor === undefined) continue;
        valores.push(valor);
        campos.push(`${coluna} = $${valores.length}`);
      }
      if (campos.length === 0) return;

      campos.push(`updated_at = now()`);
      valores.push(companyUuid, uuid);
      await manager.query(
        `UPDATE imovel_contratos SET ${campos.join(", ")} WHERE deleted_at IS NULL AND company_uuid = $${valores.length - 1} AND uuid = $${valores.length}`,
        valores,
      );
    });
  }
}
