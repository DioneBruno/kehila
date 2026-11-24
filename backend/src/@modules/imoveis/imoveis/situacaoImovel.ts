import { ImovelSituacao } from "../shared/imoveis.tipos";

/** DataSource ou o EntityManager de uma transação. */
export type Consultavel = { query: (sql: string, parametros?: unknown[]) => Promise<any> };

/**
 * Trava a linha do imóvel (FOR UPDATE) e devolve a situação; null se não existe na empresa.
 * Deve rodar dentro de transação: serializa com IncluirContrato, que trava a mesma linha.
 */
export async function travarImovel(db: Consultavel, companyUuid: string, uuid: string): Promise<ImovelSituacao | null> {
  const [row] = await db.query(`SELECT situacao FROM imovel_imoveis WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`, [
    companyUuid,
    uuid,
  ]);
  return row?.situacao ?? null;
}

/** Há contrato vigente (não excluído) da mesma empresa para o imóvel. */
export async function imovelTemContratoVigente(db: Consultavel, companyUuid: string, uuid: string): Promise<boolean> {
  const [row] = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM imovel_contratos WHERE deleted_at IS NULL AND company_uuid = $1 AND imovel_uuid = $2 AND status = 'vigente'
     ) AS existe`,
    [companyUuid, uuid],
  );
  return !!row?.existe;
}
