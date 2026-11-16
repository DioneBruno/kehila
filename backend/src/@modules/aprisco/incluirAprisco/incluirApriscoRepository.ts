import { ConnectionHub } from "../../shared/connections/connectionHub";
import { ApriscoEntity } from "./aprisco.entity";

export class IncluirApriscoRepository {
  constructor(readonly connections: ConnectionHub) {}

  async incluir(aprisco: ApriscoEntity): Promise<void> {
    const p = aprisco.props;
    await this.connections.database.query(
      `
      INSERT INTO apriscos (
        uuid, company_uuid, nome, dia_semana, horario, endereco, latitude, longitude, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      `,
      [p.uuid, p.companyUuid, p.nome, p.diaSemana ?? null, p.horario ?? null, p.endereco ?? null, p.latitude ?? null, p.longitude ?? null, p.status],
    );
  }
}
