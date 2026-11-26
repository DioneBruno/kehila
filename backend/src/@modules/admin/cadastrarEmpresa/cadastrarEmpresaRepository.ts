import { randomUUID } from "crypto";
import { ModuloChave } from "src/@modules/empresa/modulos/modulos";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type CadastrarEmpresaData = {
  uuid: string;
  adminUuid: string;
  empresa: {
    name: string;
    cpfCnpj: string;
    commercialName: string | null;
    fantasyName: string | null;
    stateRegistration: string | null;
    email: string | null;
    phone: string | null;
    uf: string | null;
    address: Record<string, unknown> | null;
  };
  dominio: string;
  modulos: ModuloChave[];
  admin: { name: string; email?: string; cpf?: string; phone?: string; passwordHash: string };
};

export class CadastrarEmpresaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existeEmpresaComModulo(modulo: ModuloChave): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT 1 AS existe FROM auth_company_modulos m
         INNER JOIN auth_companies c ON c.uuid = m.company_uuid AND c.deleted_at IS NULL
       WHERE m.modulo = $1 AND m.deleted_at IS NULL
       LIMIT 1`,
      [modulo],
    );
    return !!row;
  }

  async cadastrar(data: CadastrarEmpresaData): Promise<void> {
    const e = data.empresa;
    await this.connectionHub.database!.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO auth_companies (
           uuid, tenant_id, name, cpf_cnpj, commercial_name, fantasy_name, state_registration, email, phone, uf, address
         ) VALUES ($1, $11, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          data.uuid,
          e.name,
          e.cpfCnpj,
          e.commercialName,
          e.fantasyName,
          e.stateRegistration,
          e.email,
          e.phone,
          e.uf,
          e.address ? JSON.stringify(e.address) : null,
          data.uuid,
        ],
      );
      await manager.query(`INSERT INTO auth_company_domains (uuid, company_uuid, domain, active) VALUES ($1, $2, $3, true)`, [
        randomUUID(),
        data.uuid,
        data.dominio,
      ]);
      for (const modulo of data.modulos) {
        await manager.query(`INSERT INTO auth_company_modulos (uuid, company_uuid, modulo) VALUES ($1, $2, $3)`, [randomUUID(), data.uuid, modulo]);
      }
      await manager.query(
        `INSERT INTO auth_users (uuid, name, cpf, email, phone, password, password_date_update) VALUES ($1, $2, $3, $4, $5, $6, now())`,
        [data.adminUuid, data.admin.name, data.admin.cpf ?? null, data.admin.email ?? null, data.admin.phone ?? null, data.admin.passwordHash],
      );
      await manager.query(
        `INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, position, roles) VALUES ($1, $2, $3, true, 'admin', '[]')`,
        [randomUUID(), data.adminUuid, data.uuid],
      );
    });
  }
}
