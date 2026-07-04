import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class GerarBoletoPagamentoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}
}
