import { ApiDate } from "../shared/apiDate";
import { ApiError } from "../shared/apiError";
import { ConnectionHub } from "../shared/connectionHub";

export class PortalEventosQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarEvento(companyUuid: string, eventoUuid: string) {
    const [eventoModel] = await this.connectionHub.database.query(
      `SELECT 
      eventos.uuid,
      eventos.banner_url "bannerUrl",
      eventos.titulo,
      eventos.descricao,
      eventos.data_fim "dataFim",
      eventos.data_inicio "dataInicio",
      eventos.local_endereco "localEndereco",
      eventos.local_lat "localLat",
      eventos.local_lng "localLng",
      eventos.local_nome "localNome",
      eventos.online
    FROM eventos
    WHERE deleted_at IS NULL
      AND uuid = $1`,
      [eventoUuid],
    );
    if (!eventoModel) throw new ApiError("Evento não encontrado");

    return {
      ...eventoModel,
      dataFim: ApiDate.format(eventoModel.dataFim, "YYYY-MM-DD HH:mm"),
      dataInicio: ApiDate.format(eventoModel.dataInicio, "YYYY-MM-DD HH:mm"),
    };
  }
}
