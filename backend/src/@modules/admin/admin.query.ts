import { ConnectionHub } from "../shared/connections/connectionHub";

export type EmpresaListItem = {
  uuid: string;
  name: string;
  fantasyName: string | null;
  cpfCnpj: string;
  modulos: string[];
  dominios: string[];
  createdAt: Date;
};

export type EmpresaDetalhe = {
  uuid: string;
  name: string;
  commercialName: string | null;
  fantasyName: string | null;
  stateRegistration: string | null;
  cpfCnpj: string;
  email: string | null;
  phone: string | null;
  address: Record<string, unknown> | null;
  uf: string | null;
  createdAt: Date;
  modulos: string[];
  dominios: { uuid: string; domain: string; active: boolean; createdAt: Date }[];
};

export type ListarEmpresasFiltro = { busca?: string; pagina: number; porPagina: number };

export class AdminQuery {
  constructor(readonly connections: ConnectionHub) {}

  async listarEmpresas(filtro: ListarEmpresasFiltro): Promise<{ data: EmpresaListItem[]; total: number }> {
    const valores: unknown[] = [];
    let where = `c.deleted_at IS NULL`;
    const busca = filtro.busca?.trim();
    if (busca) {
      valores.push(`%${busca.replace(/[\\%_]/g, "\\$&")}%`);
      where += ` AND (c.name ILIKE $1 OR c.fantasy_name ILIKE $1 OR c.cpf_cnpj ILIKE $1
        OR EXISTS (SELECT 1 FROM auth_company_domains d WHERE d.company_uuid = c.uuid AND d.deleted_at IS NULL AND d.domain ILIKE $1))`;
    }

    const [{ total }] = await this.connections.database!.query(`SELECT COUNT(*)::int AS total FROM auth_companies c WHERE ${where}`, valores);

    const porPagina = Math.max(1, filtro.porPagina);
    const offset = (Math.max(1, filtro.pagina) - 1) * porPagina;
    const data: EmpresaListItem[] = await this.connections.database!.query(
      `SELECT c.uuid, c.name, c.fantasy_name AS "fantasyName", c.cpf_cnpj AS "cpfCnpj", c.created_at AS "createdAt",
        COALESCE((SELECT array_agg(m.modulo ORDER BY m.modulo) FROM auth_company_modulos m WHERE m.company_uuid = c.uuid AND m.deleted_at IS NULL), '{}') AS modulos,
        COALESCE((SELECT array_agg(d.domain ORDER BY d.domain) FROM auth_company_domains d WHERE d.company_uuid = c.uuid AND d.deleted_at IS NULL AND d.active = true), '{}') AS dominios
       FROM auth_companies c
       WHERE ${where}
       ORDER BY c.name ASC, c.uuid ASC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, porPagina, offset],
    );
    return { data, total };
  }

  async detalharEmpresa(uuid: string): Promise<EmpresaDetalhe | null> {
    const [empresa] = await this.connections.database!.query(
      `SELECT c.uuid, c.name, c.commercial_name AS "commercialName", c.fantasy_name AS "fantasyName",
        c.state_registration AS "stateRegistration", c.cpf_cnpj AS "cpfCnpj", c.email, c.phone, c.address, c.uf,
        c.created_at AS "createdAt"
       FROM auth_companies c WHERE c.deleted_at IS NULL AND c.uuid = $1`,
      [uuid],
    );
    if (!empresa) return null;

    const modulos: { modulo: string }[] = await this.connections.database!.query(
      `SELECT modulo FROM auth_company_modulos WHERE company_uuid = $1 AND deleted_at IS NULL ORDER BY modulo`,
      [uuid],
    );
    const dominios = await this.connections.database!.query(
      `SELECT uuid, domain, active, created_at AS "createdAt" FROM auth_company_domains
       WHERE company_uuid = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
      [uuid],
    );
    return { ...empresa, modulos: modulos.map((m) => m.modulo), dominios };
  }

  async existeEmpresa(uuid: string): Promise<boolean> {
    const rows = await this.connections.database!.query(`SELECT 1 FROM auth_companies WHERE deleted_at IS NULL AND uuid = $1`, [uuid]);
    return rows.length > 0;
  }
}
