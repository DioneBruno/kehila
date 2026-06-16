import { useQuasar } from "quasar";
import type { DominioHttp, CriarDominioInput, EditarDominioInput } from "src/@modules/empresa/dominio.http";
import { inject } from "vue";

export class DominioService {
  private $http = inject("dominioHttp") as DominioHttp;
  private $q = useQuasar();

  async listar() {
    try {
      this.$q.loading.show();
      const response = await this.$http.listar();
      return response.data as any[];
    } catch {
      return [];
    } finally {
      this.$q.loading.hide();
    }
  }

  async criar(input: CriarDominioInput) {
    try {
      this.$q.loading.show();
      await this.$http.criar(input);
      this.$q.notify({ type: "positive", message: "Domínio criado com sucesso" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editar(uuid: string, input: EditarDominioInput) {
    try {
      this.$q.loading.show();
      await this.$http.editar(uuid, input);
      this.$q.notify({ type: "positive", message: "Domínio atualizado com sucesso" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async deletar(uuid: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.$q
        .dialog({
          title: "Remover Domínio",
          message: "Deseja remover este domínio? Esta ação não pode ser desfeita.",
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Remover", unelevated: true, color: "negative" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await this.$http.deletar(uuid);
            this.$q.notify({ type: "positive", message: "Domínio removido" });
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
