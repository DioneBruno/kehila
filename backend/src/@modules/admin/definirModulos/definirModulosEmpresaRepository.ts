import { randomUUID } from "crypto";
import { ModuloChave } from "src/@modules/empresa/modulos/modulos";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DefinirModulosEmpresaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existeEmpresa(companyUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(`SELECT uuid FROM auth_companies WHERE uuid = $1 AND deleted_at IS NULL`, [companyUuid]);
    return !!row;
  }

  async definir(companyUuid: string, modulos: ModuloChave[]): Promise<void> {
    await this.connectionHub.database!.transaction(async (manager) => {
      await manager.query(
        `UPDATE auth_company_modulos SET deleted_at = now() WHERE company_uuid = $1 AND deleted_at IS NULL AND modulo <> ALL($2::text[])`,
        [companyUuid, modulos],
      );
      const atuais: { modulo: string }[] = await manager.query(
        `SELECT modulo FROM auth_company_modulos WHERE company_uuid = $1 AND deleted_at IS NULL`,
        [companyUuid],
      );
      const jaAtivos = new Set(atuais.map((row) => row.modulo));
      for (const modulo of modulos.filter((m) => !jaAtivos.has(m))) {
        await manager.query(`INSERT INTO auth_company_modulos (uuid, company_uuid, modulo) VALUES ($1, $2, $3)`, [randomUUID(), companyUuid, modulo]);
      }
    });
  }

  async limparCache(companyUuid: string): Promise<void> {
    try {
      await this.connectionHub.cache?.deleteKey(`modulos:${companyUuid}`);
    } catch (error) {
      console.error("Falha ao limpar cache de módulos", error);
    }
  }
}
