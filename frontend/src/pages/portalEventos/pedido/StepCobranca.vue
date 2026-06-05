<template>
  <div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">Cobranças do Pedido</div>

    <div v-if="!cobrancas || cobrancas.length === 0" class="text-grey-6 text-center q-py-lg">
      Nenhuma cobrança encontrada.
    </div>

    <div v-for="cobranca in cobrancas" :key="cobranca.uuid" class="q-mb-md">
      <q-card flat bordered>
        <q-card-section class="q-pb-xs">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2">{{ cobranca.pagadorNome }}</div>
              <div class="text-caption text-grey-6">{{ cobranca.pagadorDocumento }}</div>
            </div>
            <q-badge :color="statusColor(cobranca.status)" :label="cobranca.status" />
          </div>
          <div class="row q-mt-xs q-gutter-x-md">
            <div class="text-caption text-grey-7">
              Total: <strong>{{ formatarMoeda(Number(cobranca.valor)) }}</strong>
            </div>
            <div class="text-caption text-grey-7">
              Pago: <strong>{{ formatarMoeda(Number(cobranca.valorPago)) }}</strong>
            </div>
            <div class="text-caption text-grey-6">{{ cobranca.createdAt }}</div>
          </div>
        </q-card-section>

        <q-separator />

        <q-item
          clickable
          dense
          @click="togglePagamentos(cobranca.uuid)"
        >
          <q-item-section>
            <q-item-label class="text-caption text-grey-7">
              Pagamentos:
              <strong>{{ pagamentosPagos(cobranca.pagamentos) }} de {{ cobranca.pagamentos.length }}</strong>
              pagos
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon
              name="expand_more"
              color="grey-6"
              class="toggle-icon"
              :class="{ 'toggle-icon--open': pagamentosVisiveis[cobranca.uuid] }"
            />
          </q-item-section>
        </q-item>

        <q-slide-transition>
          <div v-show="pagamentosVisiveis[cobranca.uuid]">
            <q-separator />
            <q-list separator>
              <q-item v-for="pag in cobranca.pagamentos" :key="pag.uuid" class="q-py-sm">
                <q-item-section avatar>
                  <q-icon
                    :name="iconePagamento(pag.formaPagamento)"
                    :color="statusColor(pag.status)"
                    size="24px"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-capitalize">{{ pag.formaPagamento }}</q-item-label>
                  <q-item-label caption>
                    Vencimento: {{ formatarData(pag.vencimento) }}
                    <span v-if="pag.pagoEm"> · Pago em: {{ formatarData(pag.pagoEm) }}</span>
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="column items-end q-gutter-y-xs">
                    <div class="text-weight-medium">{{ formatarMoeda(pag.valor) }}</div>
                    <q-badge :color="statusColor(pag.status)" :label="pag.status" />
                  </div>
                </q-item-section>

                <q-item-section v-if="pag.linkBoleto" side>
                  <q-btn
                    flat
                    dense
                    round
                    icon="open_in_new"
                    color="primary"
                    :href="pag.linkBoleto"
                    target="_blank"
                  >
                    <q-tooltip>Abrir boleto</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-slide-transition>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts">
import { usePedidoStore } from "src/stores/pedido";
import { computed, defineComponent, reactive, toRefs } from "vue";

export default defineComponent({
  name: "StepCobranca",
  setup() {
    const $pedidoStore = usePedidoStore();

    const data = reactive({
      pedido: computed(() => $pedidoStore.$state.pedido),
      cobrancas: computed(() => ($pedidoStore.$state.pedido as any)?.cobrancas ?? []),
      pagamentosVisiveis: {} as Record<string, boolean>,
    });

    function togglePagamentos(uuid: string) {
      data.pagamentosVisiveis[uuid] = !data.pagamentosVisiveis[uuid];
    }

    function pagamentosPagos(pagamentos: any[]): number {
      return pagamentos.filter((p) => p.status === "pago" || p.status === "confirmado").length;
    }

    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function formatarData(valor: string | null) {
      if (!valor) return "-";
      const [ano, mes, dia] = valor.split("-");
      if (dia) return `${dia}/${mes}/${ano}`;
      return valor;
    }

    function statusColor(status: string) {
      switch (status) {
        case "pago":
        case "confirmado":
          return "positive";
        case "pendente":
          return "warning";
        case "cancelado":
        case "vencido":
          return "negative";
        default:
          return "grey";
      }
    }

    function iconePagamento(forma: string) {
      switch (forma) {
        case "boleto":
          return "description";
        case "pix":
          return "pix";
        case "cartao":
          return "credit_card";
        default:
          return "payment";
      }
    }

    return {
      ...toRefs(data),
      togglePagamentos,
      pagamentosPagos,
      formatarMoeda,
      formatarData,
      statusColor,
      iconePagamento,
    };
  },
});
</script>

<style scoped>
.toggle-icon {
  transition: transform 0.3s ease;
  animation: pulsar 1.5s ease-in-out infinite;
}

.toggle-icon--open {
  transform: rotate(180deg);
  animation: none;
}

@keyframes pulsar {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(4px); opacity: 0.5; }
}
</style>
