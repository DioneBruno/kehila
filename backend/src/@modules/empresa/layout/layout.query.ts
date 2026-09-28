import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class LayoutQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarLayoutCompanyUuid(companyUuid: string) {
    console.log("Pegando Layout", companyUuid);
  }
}
