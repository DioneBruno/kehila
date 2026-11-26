import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import type { LayoutEmpresa } from "../layout/layoutRegras";

export type EditarEmpresaData = {
  name?: string;
  commercialName?: string;
  fantasyName?: string;
  stateRegistration?: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
  uf?: string;
  layout?: LayoutEmpresa;
};

export class EditarEmpresaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid FROM auth_companies WHERE uuid = $1 AND deleted_at IS NULL`,
      [companyUuid],
    );
    return !!row;
  }

  async atualizar(companyUuid: string, data: EditarEmpresaData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    const mapeamento: Record<string, string> = {
      name: "name",
      commercialName: "commercial_name",
      fantasyName: "fantasy_name",
      stateRegistration: "state_registration",
      cpfCnpj: "cpf_cnpj",
      email: "email",
      phone: "phone",
      uf: "uf",
    };

    for (const [chave, coluna] of Object.entries(mapeamento)) {
      if (chave in data && (data as any)[chave] !== undefined) {
        campos.push(`${coluna} = $${idx}`);
        valores.push((data as any)[chave]);
        idx++;
      }
    }

    if ("address" in data && data.address !== undefined) {
      campos.push(`address = $${idx}`);
      valores.push(JSON.stringify(data.address));
      idx++;
    }

    if ("layout" in data && data.layout !== undefined) {
      // Merge raso: troca só as seções enviadas e preserva outras chaves do JSON.
      campos.push(`layout = COALESCE(layout, '{}'::jsonb) || $${idx}::jsonb`);
      valores.push(JSON.stringify(data.layout));
      idx++;
    }

    if (campos.length === 0) return;

    campos.push(`updated_at = now()`);
    valores.push(companyUuid);

    await this.connectionHub.database!.query(
      `UPDATE auth_companies SET ${campos.join(", ")} WHERE uuid = $${idx}`,
      valores,
    );
  }
}
