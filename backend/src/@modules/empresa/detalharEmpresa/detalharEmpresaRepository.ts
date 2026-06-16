import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

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
  createdAt: string;
  updatedAt: string;
};

export class DetalharEmpresaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPorUuid(companyUuid: string): Promise<EmpresaDetalhe | null> {
    const [row] = await this.connectionHub.database!.query(
      `
      SELECT
        c.uuid,
        c.name,
        c.commercial_name AS "commercialName",
        c.fantasy_name AS "fantasyName",
        c.state_registration AS "stateRegistration",
        c.cpf_cnpj AS "cpfCnpj",
        c.email,
        c.phone,
        c.address,
        c.uf,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM auth_companies c
      WHERE c.deleted_at IS NULL
        AND c.uuid = $1
      `,
      [companyUuid],
    );

    return row ?? null;
  }
}
