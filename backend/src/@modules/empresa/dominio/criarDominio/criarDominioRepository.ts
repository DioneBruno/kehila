import { randomUUID } from "crypto";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type CriarDominioData = {
  companyUuid: string;
  domain: string;
  active?: boolean;
};

export type DominioCriado = {
  uuid: string;
};

export class CriarDominioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async criar(data: CriarDominioData): Promise<DominioCriado> {
    const uuid = randomUUID();

    await this.connectionHub.database!.query(
      `
      INSERT INTO auth_company_domains (
        uuid, company_uuid, domain, active
      ) VALUES (
        $1, $2, $3, $4
      )
      `,
      [uuid, data.companyUuid, data.domain, data.active ?? true],
    );

    return { uuid };
  }
}
