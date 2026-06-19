import { useQuasar } from "quasar";
import type { CriarUsuarioInput, EditarUsuarioInput, UsuarioHttp } from "src/@modules/usuario/usuario.http";
import { inject } from "vue";
import { useRouter } from "vue-router";

export class UsuarioService {
  private $http = inject("usuarioHttp") as UsuarioHttp;
  private $q = useQuasar();
  private $router = useRouter();

  async listar(params?: { busca?: string; pagina?: number; porPagina?: number }) {
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

  async criar(input: CriarUsuarioInput) {
    try {
      this.$q.loading.show();
      const response = await this.$http.criar(input);
      void this.$router.push({ name: "usuarios.detalhe", params: { uuid: response.data.uuid } });
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editar(uuid: string, input: EditarUsuarioInput) {
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

  async deletar(uuid: string) {
    return this.$confirmar(
      "Excluir usuário",
      "Tem certeza que deseja remover o acesso deste usuário à empresa? Esta ação não pode ser desfeita.",
      async () => {
        await this.$http.deletar(uuid);
        void this.$router.push({ name: "usuarios" });
      },
    );
  }

  private $confirmar(titulo: string, mensagem: string, acao: () => Promise<void>): Promise<boolean> {
    return new Promise((resolve) => {
      this.$q
        .dialog({
          title: titulo,
          message: mensagem,
          cancel: { label: "Não", flat: true, color: "grey" },
          ok: { label: "Sim", unelevated: true, color: "negative" },
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
