import { useQuasar } from "quasar";
import type { EmpresaHttp, EditarEmpresaInput } from "src/@modules/empresa/empresa.http";
import { inject } from "vue";

export class EmpresaService {
  private $http = inject("empresaHttp") as EmpresaHttp;
  private $q = useQuasar();

  async buscar() {
    try {
      this.$q.loading.show();
      const response = await this.$http.buscar();
      return response.data;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async editar(input: EditarEmpresaInput) {
    try {
      this.$q.loading.show();
      await this.$http.editar(input);
      return true;
    } catch {
      return false;
    } finally {
      this.$q.loading.hide();
    }
  }
}
