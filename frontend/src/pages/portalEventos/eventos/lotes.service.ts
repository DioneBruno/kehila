import { useQuasar } from "quasar";
import type { LotesHttp } from "src/@modules/portalEventos/lotes.http";
import { inject } from "vue";

export class LotesService {
  private $http = inject("lotesHttp") as LotesHttp;
  private $q = useQuasar();

  async listar(eventoUuid: string) {
    try {
      this.$q.loading.show();
      const response = await this.$http.listar(eventoUuid);
      return response.data as any[];
    } catch {
      return [];
    } finally {
      this.$q.loading.hide();
    }
  }

  async criar(input: any) {
    try {
      this.$q.loading.show();
      await this.$http.criar(input);
      this.$q.notify({ type: "positive", message: "Lote criado com sucesso" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editar(loteUuid: string, input: any) {
    try {
      this.$q.loading.show();
      await this.$http.editar(loteUuid, input);
      this.$q.notify({ type: "positive", message: "Lote atualizado com sucesso" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async remover(loteUuid: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.$q
        .dialog({
          title: "Remover Lote",
          message: "Deseja remover este lote? Esta ação não pode ser desfeita.",
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Remover", unelevated: true, color: "negative" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await this.$http.remover(loteUuid);
            this.$q.notify({ type: "positive", message: "Lote removido" });
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

  async criarTipo(loteUuid: string, input: any) {
    try {
      this.$q.loading.show();
      await this.$http.criarTipo(loteUuid, input);
      this.$q.notify({ type: "positive", message: "Tipo de ingresso criado" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editarTipo(loteUuid: string, tipoUuid: string, input: any) {
    try {
      this.$q.loading.show();
      await this.$http.editarTipo(loteUuid, tipoUuid, input);
      this.$q.notify({ type: "positive", message: "Tipo de ingresso atualizado" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async reordenarLotes(lotes: { uuid: string; ordem: number }[]): Promise<boolean> {
    try {
      await this.$http.reordenarLotes(lotes);
      return true;
    } catch {
      return false;
    }
  }

  async reordenarTiposIngresso(loteUuid: string, tipos: { uuid: string; ordem: number }[]): Promise<boolean> {
    try {
      await this.$http.reordenarTiposIngresso(loteUuid, tipos);
      return true;
    } catch {
      return false;
    }
  }

  async removerTipo(loteUuid: string, tipoUuid: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.$q
        .dialog({
          title: "Remover Tipo de Ingresso",
          message: "Deseja remover este tipo de ingresso?",
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Remover", unelevated: true, color: "negative" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await this.$http.removerTipo(loteUuid, tipoUuid);
            this.$q.notify({ type: "positive", message: "Tipo de ingresso removido" });
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
