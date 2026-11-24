import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImovelSituacao } from "../shared/imoveis.tipos";

export async function buscarSituacaoImovel(connections: ConnectionHub, companyUuid: string, uuid: string): Promise<ImovelSituacao | null> {
  const [row] = await connections.database.query(`SELECT situacao FROM imovel_imoveis WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
    companyUuid,
    uuid,
  ]);
  return row?.situacao ?? null;
}

/** Há contrato vigente (não excluído) da mesma empresa para o imóvel. */
export async function imovelTemContratoVigente(connections: ConnectionHub, companyUuid: string, uuid: string): Promise<boolean> {
  const [row] = await connections.database.query(
    `SELECT EXISTS (
       SELECT 1 FROM imovel_contratos WHERE deleted_at IS NULL AND company_uuid = $1 AND imovel_uuid = $2 AND status = 'vigente'
     ) AS existe`,
    [companyUuid, uuid],
  );
  return !!row?.existe;
}
