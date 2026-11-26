import { useQuasar } from "quasar";
import type {
  AdminEmpresaHttp,
  CadastrarEmpresaInput,
  DominioInput,
  EmpresaDadosInput,
  EmpresaDetalhe,
  EmpresaDominio,
  EmpresaResumo,
  ListarEmpresasParams,
} from "src/@modules/admin/empresa.http";
import { inject } from "vue";

export const MODULOS_EMPRESA = [
  { label: "Igreja", value: "igreja" },
  { label: "Imóveis", value: "imoveis" },
  { label: "Admin", value: "admin" },
];

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function labelModulo(valor: string) {
  return MODULOS_EMPRESA.find((m) => m.value === valor)?.label ?? valor;
}

export class AdminEmpresaService {
  private $http = inject("adminEmpresaHttp") as AdminEmpresaHttp;
  private $q = useQuasar();

  async listar(params: ListarEmpresasParams) {
    try {
      const response = await this.$http.listar(params);
      const itens = response.data as EmpresaResumo[];
      return { itens, total: (response.meta?.total ?? itens.length) as number };
    } catch {
      return null;
    }
  }

  async detalhar(uuid: string) {
    try {
      this.$q.loading.show();
      return (await this.$http.detalhar(uuid)).data as EmpresaDetalhe;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async cadastrar(input: CadastrarEmpresaInput) {
    try {
      this.$q.loading.show();
      return (await this.$http.cadastrar(input)).data.uuid as string;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editar(uuid: string, input: EmpresaDadosInput) {
    try {
      this.$q.loading.show();
      await this.$http.editar(uuid, input);
      this.$q.notify({ type: "positive", message: "Empresa atualizada com sucesso" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async listarDominios(uuid: string) {
    try {
      this.$q.loading.show();
      return (await this.$http.listarDominios(uuid)).data as EmpresaDominio[];
    } catch {
      return [] as EmpresaDominio[];
    } finally {
      this.$q.loading.hide();
    }
  }

  async criarDominio(uuid: string, input: DominioInput) {
    try {
      this.$q.loading.show();
      await this.$http.criarDominio(uuid, input);
      this.$q.notify({ type: "positive", message: "Domínio criado com sucesso" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editarDominio(uuid: string, dominioUuid: string, input: DominioInput) {
    try {
      this.$q.loading.show();
      await this.$http.editarDominio(uuid, dominioUuid, input);
      this.$q.notify({ type: "positive", message: "Domínio atualizado com sucesso" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  async deletarDominio(uuid: string, dominioUuid: string): Promise<boolean> {
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
            await this.$http.deletarDominio(uuid, dominioUuid);
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

  async definirModulos(uuid: string, modulos: string[]) {
    try {
      this.$q.loading.show();
      await this.$http.definirModulos(uuid, modulos);
      this.$q.notify({ type: "positive", message: "Módulos atualizados" });
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }

  notificarCriada(dominio: string) {
    this.$q.notify({ type: "positive", message: `Empresa criada. O admin entra em ${dominio}` });
  }
}
