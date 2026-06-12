import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type EditarContaBancariaData = {
  nome?: string;
  bancoNumero?: string;
  agencia?: string;
  conta?: string;
  digito?: string;
  chaveApi?: string;
  status?: string;
};

export class EditarContaBancariaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string, contaBancariaUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid FROM financeiro_contas_bancarias WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
      [contaBancariaUuid, companyUuid],
    );
    return !!row;
  }

  async atualizar(companyUuid: string, contaBancariaUuid: string, data: EditarContaBancariaData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    const mapeamento: Record<string, string> = {
      nome: "nome",
      bancoNumero: "banco_numero",
      agencia: "agencia",
      conta: "conta",
      digito: "digito",
      chaveApi: "chave_api",
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
    valores.push(contaBancariaUuid, companyUuid);

    await this.connectionHub.database!.query(
      `UPDATE financeiro_contas_bancarias SET ${campos.join(", ")} WHERE uuid = $${idx} AND company_uuid = $${idx + 1}`,
      valores,
    );
  }
}
