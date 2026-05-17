import { useQuasar } from "quasar";
import type { EventosHttp } from "src/@modules/portalEventos/eventos.http";
import { inject } from "vue";
import { useRouter } from "vue-router";

export const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  em_vendas: "Em Vendas",
  esgotado: "Esgotado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export const STATUS_CORES: Record<string, string> = {
  rascunho: "grey",
  publicado: "primary",
  em_vendas: "positive",
  esgotado: "orange",
  encerrado: "grey-7",
  cancelado: "negative",
};

export class EventosService {
  private $http = inject("eventosHttp") as EventosHttp;
  private $q = useQuasar();
  private $router = useRouter();

  async listar(params?: { status?: string; busca?: string; pagina?: number; porPagina?: number }) {
    try {
      this.$q.loading.show();
      const response = await this.$http.listar(params);
      return response;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async buscarPorUuid(uuid: string) {
    try {
      this.$q.loading.show();
      const response = await this.$http.buscarPorUuid(uuid);
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async criar(input: any) {
    try {
      this.$q.loading.show();
      const response = await this.$http.criar(input);
      void this.$router.push({ name: "eventos.detalhe", params: { uuid: response.data.uuid } });
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editar(uuid: string, input: any) {
    try {
      this.$q.loading.show();
      await this.$http.editar(uuid, input);
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async publicar(uuid: string) {
    return this.$confirmar("Publicar evento", "Deseja publicar este evento?", async () => {
      await this.$http.publicar(uuid);
    });
  }

  async cancelar(uuid: string) {
    return this.$confirmar(
      "Cancelar evento",
      "Tem certeza que deseja cancelar este evento? Os inscritos serão notificados.",
      async () => {
        await this.$http.cancelar(uuid);
      },
    );
  }

  async encerrar(uuid: string) {
    return this.$confirmar("Encerrar evento", "Deseja encerrar este evento?", async () => {
      await this.$http.encerrar(uuid);
    });
  }

  private $confirmar(titulo: string, mensagem: string, acao: () => Promise<void>): Promise<boolean> {
    return new Promise((resolve) => {
      this.$q
        .dialog({
          title: titulo,
          message: mensagem,
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Sim", unelevated: true, color: "primary" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await acao();
            resolve(true);
          } catch {
            resolve(false);
          } finally {
            this.$q.loading.hide();
          }
        })
        .onCancel(() => resolve(false));
    });
  }
}
