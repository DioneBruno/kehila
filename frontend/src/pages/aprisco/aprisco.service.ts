import { useQuasar } from "quasar";
import type { ApriscoHttp, ApriscoInput, ApriscoStatus } from "src/@modules/aprisco/aprisco.http";
import { inject } from "vue";
import { useRouter } from "vue-router";

export const STATUS_APRISCO: { value: ApriscoStatus; label: string; color: string }[] = [
  { value: "ativo", label: "Ativo", color: "positive" },
  { value: "inativo", label: "Inativo", color: "grey-6" },
];

export function statusAprisco(status: ApriscoStatus) {
  return (
    STATUS_APRISCO.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      color: "grey-6",
    }
  );
}

/** Link do Google Maps: usa as coordenadas se houver, senão o endereço. */
export function linkMapa(aprisco: {
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
}) {
  if (aprisco.latitude !== null && aprisco.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${aprisco.latitude},${aprisco.longitude}`;
  }
  if (aprisco.endereco) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(aprisco.endereco)}`;
  }
  return null;
}

export class ApriscoService {
  private $http = inject("apriscoHttp") as ApriscoHttp;
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

  async incluir(input: ApriscoInput) {
    try {
      this.$q.loading.show();
      const response = await this.$http.incluir(input);
      this.$q.notify({ type: "positive", message: "Aprisco cadastrado" });
      void this.$router.push({ name: "apriscos.detalhe", params: { uuid: response.data.uuid } });
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async alterar(uuid: string, input: Partial<ApriscoInput>) {
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
          title: "Excluir aprisco",
          message: "Tem certeza que deseja excluir este aprisco? Esta ação não pode ser desfeita.",
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Sim", unelevated: true, color: "negative" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await this.$http.deletar(uuid);
            this.$q.notify({ type: "positive", message: "Aprisco excluído" });
            void this.$router.push({ name: "apriscos" });
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
