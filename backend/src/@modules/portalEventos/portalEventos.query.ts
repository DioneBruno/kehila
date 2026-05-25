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

    const lotesModel = await this.connectionHub.database.query(
      `SELECT
        uuid,
        ativo,
        data_fim "dataFim",
        data_inicio "dataInicio",
        nome
      FROM evento_lotes WHERE deleted_at IS NULL AND evento_uuid = $1`,
      [eventoUuid],
    );

    const tiposEngressoModel = await this.connectionHub.database.query(
      `SELECT 
        uuid,
        nome,
        descricao,
        evento_uuid "eventoUuid",
        lote_uuid "loteUuid",
        visivel,
        preco
      FROM evento_lote_tipos_ingresso WHERE deleted_at IS NULL AND evento_uuid = $1`,
      [eventoUuid],
    );

    eventoModel.lotes = lotesModel;

    for (const lote of lotesModel) {
      lote.tiposEngresso = tiposEngressoModel.filter((tipoEngresso) => tipoEngresso.loteUuid === lote.uuid);
    }

    // eventoModel.tiposEngresso = tiposEngressoModel;

    return {
      ...eventoModel,
      dataFim: ApiDate.format(eventoModel.dataFim, "YYYY-MM-DD HH:mm"),
      dataInicio: ApiDate.format(eventoModel.dataInicio, "YYYY-MM-DD HH:mm"),
    };
  }
}
