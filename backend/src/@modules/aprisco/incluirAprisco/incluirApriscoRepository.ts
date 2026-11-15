import { ConnectionHub } from "../../shared/connections/connectionHub";
import { ApriscoEntity } from "./aprisco.entity";

export class IncluirApriscoRepository {
  constructor(readonly connections: ConnectionHub) {}

  async incluir(aprisco: ApriscoEntity): Promise<void> {
    const p = aprisco.props;
    await this.connections.database.query(
      `
      INSERT INTO apriscos (
        uuid, company_uuid, nome, horario, endereco, latitude, longitude, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      `,
      [p.uuid, p.companyUuid, p.nome, p.horario ?? null, p.endereco ?? null, p.latitude ?? null, p.longitude ?? null, p.status],
    );
  }
}
