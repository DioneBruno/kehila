import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImovelSituacao } from "../shared/imoveis.tipos";

export async function buscarSituacaoImovel(connections: ConnectionHub, companyUuid: string, uuid: string): Promise<ImovelSituacao | null> {
  const [row] = await connections.database.query(`SELECT situacao FROM imovel_imoveis WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
    companyUuid,
    uuid,
  ]);
  return row?.situacao ?? null;
}

/**
 * Seam único da Task 6: hoje o contrato vigente é refletido por situacao = 'alugado' (só o contrato a define).
 * Quando imovel_contratos existir, trocar por EXISTS (status = 'vigente').
 */
export async function imovelTemContratoVigente(connections: ConnectionHub, companyUuid: string, uuid: string): Promise<boolean> {
  return (await buscarSituacaoImovel(connections, companyUuid, uuid)) === "alugado";
}
