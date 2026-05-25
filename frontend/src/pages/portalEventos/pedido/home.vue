<template>
  <q-page class="bg-grey-2" :class="{ 'page-with-bar': totalIngressos > 0 }">
    <!-- Hero do evento -->
    <Cabecalho />

    <!-- Conteúdo principal -->
    <div class="hero-container q-px-md q-py-md">
      <div class="row q-col-gutter-lg">
        <!-- Stepper de compra -->
        <div class="col-12 col-md-8">
          <q-stepper v-model="etapa" animated color="primary" flat bordered vertical>
            <q-step :name="1" title="Ingressos" icon="confirmation_number" :done="etapa > 1">
              <StepIngressos
                :lotes="lotes"
                :quantidades="quantidades"
                :total-ingressos="totalIngressos"
                @aumentar="aumentar"
                @diminuir="diminuir"
                @next="etapa = 2"
              />
            </q-step>

            <q-step :name="2" title="Seus Dados" icon="person" :done="etapa > 2">
              <StepSeusDados
                :form="form"
                @update:form="Object.assign(form, $event)"
                @prev="etapa = 1"
                @next="etapa = 3"
              />
            </q-step>

            <q-step :name="3" title="Pagamento" icon="payment">
              <StepPagamento
                :forma-pagamento="formaPagamento"
                :cartao="cartao"
                :opcoes-parcelas="opcoesParcelas"
                @update:forma-pagamento="formaPagamento = $event"
                @update:cartao="Object.assign(cartao, $event)"
                @prev="etapa = 2"
                @confirmar="confirmar"
              />
            </q-step>
          </q-stepper>
        </div>

        <!-- Resumo lateral: somente desktop -->
        <PedidoResumo />
      </div>
    </div>

    <!-- Barra inferior: somente mobile, quando há ingressos -->
    <transition name="slide-up">
      <div v-if="totalIngressos > 0" class="lt-md resumo-bar-mobile">
        <q-card flat square class="shadow-up-4">
          <q-card-section class="q-py-sm q-px-md">
            <div class="row items-center justify-between no-wrap">
              <div>
                <div class="text-caption text-grey-6">{{ totalIngressos }} ingresso(s)</div>
                <div class="text-subtitle1 text-weight-bold text-primary">
                  {{ formatarMoeda(totalValor) }}
                </div>
              </div>
              <q-btn
                unelevated
                color="primary"
                icon="receipt_long"
                label="Ver resumo"
                size="sm"
                @click="resumoAberto = true"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </transition>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { useRoute } from "vue-router";
import { usePedidoStore } from "src/stores/pedido";

import Cabecalho from "./cabecalho.vue";
import PedidoResumo from "./resumo.vue";
import StepIngressos from "./StepIngressos.vue";
import StepSeusDados from "./StepSeusDados.vue";
import StepPagamento from "./StepPagamento.vue";

const LOTES_MOCK = [
  {
    uuid: "lote-1",
    nome: "1º Lote",
    tiposIngresso: [
      { uuid: "tipo-1", nome: "Inteira", descricao: "", preco: 80, disponivel: 50 },
      {
        uuid: "tipo-2",
        nome: "Meia-entrada",
        descricao: "Estudantes com carteirinha",
        preco: 40,
        disponivel: 20,
      },
    ],
  },
  {
    uuid: "lote-2",
    nome: "VIP",
    tiposIngresso: [
      {
        uuid: "tipo-3",
        nome: "VIP",
        descricao: "Acesso à área exclusiva + open bar",
        preco: 200,
        disponivel: 10,
      },
    ],
  },
];

const OPCOES_PARCELAS = [
  { label: "1× de R$ 80,00 (sem juros)", value: 1 },
  { label: "2× de R$ 40,00 (sem juros)", value: 2 },
  { label: "3× de R$ 26,67 (sem juros)", value: 3 },
];

export default defineComponent({
  name: "PortalEventosPedidoHome",
  components: { Cabecalho, PedidoResumo, StepIngressos, StepSeusDados, StepPagamento },
  setup() {
    const $route = useRoute();
    const $pedidoStore = usePedidoStore();
    const $service = new PedidoService();

    const data = reactive({
      etapa: 1,
      resumoAberto: false,
      evento: computed(() => $pedidoStore.$state.evento),
      lotes: LOTES_MOCK,
      quantidades: {},
      form: {
        nome: "",
        email: "",
        celular: "",
        cpf: "",
      },
      formaPagamento: "",
      cartao: {
        numero: "",
        nome: "",
        validade: "",
        cvv: "",
        parcelas: 1,
      },
      opcoesParcelas: OPCOES_PARCELAS,
    });

    onMounted(async () => {
      await buscaEvento();
    });

    async function buscaEvento() {
      const eventoUuid = $route.params.eventoUuid as string;
      await $service.buscaEvento(eventoUuid);
    }

    const itensSelecionados = computed(() => {
      const itens: { uuid: string; nome: string; qtd: number; subtotal: number }[] = [];
      for (const lote of data.lotes) {
        for (const tipo of lote.tiposIngresso) {
          const qtd = data.quantidades[tipo.uuid] ?? 0;
          if (qtd > 0) {
            itens.push({ uuid: tipo.uuid, nome: tipo.nome, qtd, subtotal: qtd * tipo.preco });
          }
        }
      }
      return itens;
    });

    const totalIngressos = computed(() =>
      itensSelecionados.value.reduce((acc, i) => acc + i.qtd, 0),
    );

    const totalValor = computed(() =>
      itensSelecionados.value.reduce((acc, i) => acc + i.subtotal, 0),
    );

    function aumentar(uuid: string, tipo: { disponivel: number }) {
      const atual = data.quantidades[uuid] ?? 0;
      if (atual < tipo.disponivel) data.quantidades[uuid] = atual + 1;
    }

    function diminuir(uuid: string) {
      const atual = data.quantidades[uuid] ?? 0;
      if (atual > 0) data.quantidades[uuid] = atual - 1;
    }

    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function confirmar() {
      // TODO: integrar com API de pedidos
    }

    return {
      ...toRefs(data),
      itensSelecionados,
      totalIngressos,
      totalValor,
      aumentar,
      diminuir,
      formatarMoeda,
      confirmar,
    };
  },
});
</script>

<style scoped>
.hero-container {
  max-width: 1100px;
  margin: 0 auto;
}

.resumo-sticky {
  position: sticky;
  top: 16px;
}

.resumo-bar-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

@media (max-width: 1023px) {
  .page-with-bar {
    padding-bottom: 72px;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
