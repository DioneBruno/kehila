import { PublicHttp } from "src/@modules/shared/public.http";
import { useLayoutStore } from "src/stores/layout";
import { inject } from "vue";

export class MainLayoutService {
  public publicHttp = inject("publicHttp") as PublicHttp;
  private layoutStore = useLayoutStore();

  constructor() {}

  async ping() {
    const result = await this.publicHttp.ping();
    this.layoutStore.setLayout(result.layout);
    return result;
  }
}