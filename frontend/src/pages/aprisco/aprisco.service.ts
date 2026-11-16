import { useQuasar } from "quasar";
import type {
  ApriscoHttp,
  ApriscoInput,
  ApriscoStatus,
  IntegranteInput,
  PapelIntegrante,
  RegistrarPresencasInput,
} from "src/@modules/aprisco/aprisco.http";
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

export const PAPEIS_INTEGRANTE: {
  value: PapelIntegrante;
  label: string;
  color: string;
  icon: string;
}[] = [
  { value: "LIDER", label: "Líder", color: "primary", icon: "star" },
  { value: "AUXILIAR", label: "Auxiliar", color: "secondary", icon: "support_agent" },
  { value: "ANFITRIAO", label: "Anfitrião", color: "teal", icon: "home" },
  { value: "MEMBRO", label: "Membro", color: "grey-7", icon: "person" },
];

export function papelIntegrante(papel: PapelIntegrante) {
  return (
    PAPEIS_INTEGRANTE.find((p) => p.value === papel) ?? {
      value: papel,
      label: papel,
      color: "grey-7",
      icon: "person",
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
      this.$q.loading.show();
      const response = await this.$http.listar();
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async listarLiderados() {
    try {
      this.$q.loading.show();
      const response = await this.$http.listarLiderados();
      return response.data;
    } catch {
      return [];
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

  async listarIntegrantes(uuid: string) {
    try {
      const response = await this.$http.listarIntegrantes(uuid);
      return response.data;
    } catch {
      return null;
    }
  }

  async vincularIntegrante(uuid: string, input: IntegranteInput) {
    try {
      this.$q.loading.show();
      await this.$http.vincularIntegrante(uuid, input);
      this.$q.notify({ type: "positive", message: "Integrante adicionado" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async disvincularIntegrante(uuid: string, integranteUuid: string, nome?: string | null) {
    return new Promise<boolean>((resolve) => {
      this.$q
        .dialog({
          title: "Remover integrante",
          message: `Deseja remover ${nome || "este integrante"} do aprisco?`,
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Sim", unelevated: true, color: "negative" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await this.$http.disvincularIntegrante(uuid, integranteUuid);
            this.$q.notify({ type: "positive", message: "Integrante removido" });
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

  async listarPresencas(uuid: string, dataReuniao: string) {
    try {
      const response = await this.$http.listarPresencas(uuid, dataReuniao);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Registra em uma única requisição as presenças da reunião; reenviar atualiza os registros existentes. */
  async registrarPresencas(uuid: string, input: RegistrarPresencasInput) {
    try {
      this.$q.loading.show();
      await this.$http.registrarPresencas(uuid, input);
      this.$q.notify({ type: "positive", message: "Presenças registradas" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }
}
