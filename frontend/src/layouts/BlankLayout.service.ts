import { PublicHttp } from "src/@modules/shared/public.http";
import { inject } from "vue";

export class BlankLayoutService {
  public publicHttp = inject("publicHttp") as PublicHttp;

  constructor() {}

  async ping() {
    const result = await this.publicHttp.ping();
    return result;
  }
}