import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type EditarDominioData = {
  domain?: string;
  active?: boolean;
};

export class EditarDominioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string, dominioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid FROM auth_company_domains WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
      [dominioUuid, companyUuid],
    );
    return !!row;
  }

  async atualizar(companyUuid: string, dominioUuid: string, data: EditarDominioData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    const mapeamento: Record<string, string> = {
      domain: "domain",
      active: "active",
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
    valores.push(dominioUuid, companyUuid);

    await this.connectionHub.database!.query(
      `UPDATE auth_company_domains SET ${campos.join(", ")} WHERE uuid = $${idx} AND company_uuid = $${idx + 1}`,
      valores,
    );
  }
}
