import { useQuasar } from "quasar";
import type {
  CriarUsuarioMembroInput,
  MembresiaHttp,
  MembroInput,
  TipoVinculo,
  VinculoInput,
} from "src/@modules/membresia/membresia.http";
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

export const TIPOS_VINCULO: { value: TipoVinculo; label: string }[] = [
  { value: "PAI", label: "Pai" },
  { value: "MAE", label: "Mãe" },
  { value: "FILHO", label: "Filho" },
  { value: "FILHA", label: "Filha" },
  { value: "CONJUGE", label: "Cônjuge" },
  { value: "IRMAO", label: "Irmão" },
  { value: "IRMA", label: "Irmã" },
  { value: "AVO", label: "Avô / Avó" },
  { value: "NETO", label: "Neto" },
  { value: "NETA", label: "Neta" },
  { value: "TIO", label: "Tio" },
  { value: "TIA", label: "Tia" },
  { value: "SOBRINHO", label: "Sobrinho" },
  { value: "SOBRINHA", label: "Sobrinha" },
  { value: "OUTRO", label: "Outro" },
];

/** Inversos aceitos por tipo (o primeiro é o padrão). Mantém em sincronia com o backend. */
export const INVERSOS_VINCULO: Record<TipoVinculo, TipoVinculo[]> = {
  PAI: ["FILHO", "FILHA"],
  MAE: ["FILHO", "FILHA"],
  FILHO: ["PAI", "MAE"],
  FILHA: ["PAI", "MAE"],
  CONJUGE: ["CONJUGE"],
  IRMAO: ["IRMAO", "IRMA"],
  IRMA: ["IRMAO", "IRMA"],
  AVO: ["NETO", "NETA"],
  NETO: ["AVO"],
  NETA: ["AVO"],
  TIO: ["SOBRINHO", "SOBRINHA"],
  TIA: ["SOBRINHO", "SOBRINHA"],
  SOBRINHO: ["TIO", "TIA"],
  SOBRINHA: ["TIO", "TIA"],
  OUTRO: ["OUTRO"],
};

export function labelTipoVinculo(tipo: TipoVinculo) {
  return TIPOS_VINCULO.find((t) => t.value === tipo)?.label ?? tipo;
}

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

  async criarUsuario(uuid: string, input: CriarUsuarioMembroInput) {
    try {
      this.$q.loading.show();
      const response = await this.$http.criarUsuario(uuid, input);
      this.$q.notify({ type: "positive", message: "Usuário de acesso criado" });
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async listarVinculos(uuid: string) {
    try {
      const response = await this.$http.listarVinculos(uuid);
      return response.data;
    } catch {
      return null;
    }
  }

  async vincular(uuid: string, vinculos: VinculoInput[]) {
    try {
      this.$q.loading.show();
      await this.$http.vincular(uuid, vinculos);
      this.$q.notify({ type: "positive", message: "Vínculo adicionado" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async removerVinculo(uuid: string, vinculoUuid: string) {
    return new Promise<boolean>((resolve) => {
      this.$q
        .dialog({
          title: "Remover vínculo",
          message: "Deseja remover este vínculo? O vínculo inverso também será removido.",
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Sim", unelevated: true, color: "negative" },
          persistent: true,
        })
        .onOk(async () => {
          try {
            this.$q.loading.show();
            await this.$http.removerVinculo(uuid, vinculoUuid);
            this.$q.notify({ type: "positive", message: "Vínculo removido" });
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
