// import RoleGatewayHttp from "@infra/Auth/Role/roleGateway.http";
import type { BiGateway } from "src/@modules/BI/bi.gateway";
import { inject } from "vue";

export class BiService {
  private biGateway = inject("biGateway") as BiGateway;
  // private $roleGateway = inject("roleGateway") as RoleGatewayHttp;

  constructor() {}

  async list(filtros: any) {
    return await this.biGateway.listBi(filtros);
  }

  async save(bi: any) {
    await this.biGateway.saveBi(bi);
  }

  async delete(uuid: string) {
    await this.biGateway.deleteBi(uuid);
  }

  async montar(uuid: string) {
    return await this.biGateway.montar(uuid);
  }

  async getRoles() {
    // return await this.$roleGateway.getRoles();
    return [];
  }
}
