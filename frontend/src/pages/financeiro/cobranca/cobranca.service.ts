import { useQuasar } from "quasar";
import type { CobrancaHttp } from "src/@modules/financeiro/cobranca.http";
import type { PagamentoHttp } from "src/@modules/financeiro/pagamento.http";
import { inject } from "vue";

export const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const STATUS_CORES: Record<string, string> = {
  pendente: "orange",
  pago: "positive",
  vencido: "negative",
  cancelado: "grey-6",
};

export class CobrancaService {
  private $cobrancaHttp = inject("cobrancaHttp") as CobrancaHttp;
  private $pagamentoHttp = inject("pagamentoHttp") as PagamentoHttp;
  private $q = useQuasar();

  async listar(params?: { busca?: string; status?: string; pagina?: number; porPagina?: number }) {
    try {
      this.$q.loading.show();
      const response = await this.$cobrancaHttp.listar(params);
      return response;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }

  async pagamentoGerarBoleto(uuid: string, vencimento?: string) {
    try {
      this.$q.loading.show();
      const response = await this.$pagamentoHttp.gerarBoleto(uuid, vencimento);
      return response;
    } catch {
      return null;
    } finally {
      this.$q.loading.hide();
    }
  }
}
