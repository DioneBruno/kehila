import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class LayoutQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarLayoutDominio(dominio: string) {
    console.log("Pegando Layout");
  }
}
