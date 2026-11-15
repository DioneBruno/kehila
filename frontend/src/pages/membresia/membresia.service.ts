import { useQuasar } from "quasar";
import type { MembresiaHttp, MembroInput } from "src/@modules/membresia/membresia.http";
import { inject } from "vue";
import { useRouter } from "vue-router";

export const ESTADOS_CIVIS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "uniao", label: "União estável" },
  { value: "separado", label: "Separado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "outros", label: "Outros" },
];

export class MembresiaService {
  private $http = inject("membresiaHttp") as MembresiaHttp;
  private $q = useQuasar();
  private $router = useRouter();

  async listar() {
    try {
      const response = await this.$http.listar();
      return response.data;
    } catch {
      return null;
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

  async incluir(input: MembroInput) {
    try {
      this.$q.loading.show();
      const response = await this.$http.incluir(input);
      this.$q.notify({ type: "positive", message: "Membro cadastrado" });
      void this.$router.push({ name: "membros.detalhe", params: { uuid: response.data.uuid } });
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async alterar(uuid: string, input: Partial<MembroInput>) {
    try {
      this.$q.loading.show();
      await this.$http.alterar(uuid, input);
      this.$q.notify({ type: "positive", message: "Alterações salvas" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async deletar(uuid: string) {
    return new Promise<boolean>((resolve) => {
      this.$q
        .dialog({
          title: "Excluir membro",
          message: "Tem certeza que deseja excluir este membro? Esta ação não pode ser desfeita.",
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Sim", unelevated: true, color: "negative" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await this.$http.deletar(uuid);
            void this.$router.push({ name: "membros" });
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
