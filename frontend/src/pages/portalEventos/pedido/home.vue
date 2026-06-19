<template>
  <q-page
    class="bg-grey-2"
    style="padding-bottom: 120px"
    :class="{ 'page-with-bar': totalIngressos > 0 }"
  >
    <!-- Hero do evento -->
    <Cabecalho />

    <!-- Conteúdo principal -->
    <div class="hero-container q-px-xs q-py-xs">
      <div class="row q-col-gutter-md">
        <!-- Stepper de compra -->
        <div class="col-12 col-md-8">
          <div class="q-pa-sm">
            <q-btn
              :flat="pedido.tab !== 'ingressos'"
              color="grey-8"
              label="Incrição"
              icon="confirmation_number"
              @click="pedido.tab = 'ingressos'"
            />
            <q-btn
              :flat="pedido.tab !== 'pedidos'"
              color="grey-8"
              label="Meus Pedidos"
              icon="list"
              @click="pedido.tab = 'pedidos'"
            />
          </div>
          <q-tab-panels v-model="pedido.tab" animated class="">
            <q-tab-panel name="ingressos" class="q-pa-none">
              <q-stepper
                flat
                bordered
                vertical
                animated
                v-model="pedido.etapa"
                color="primary"
                class="q-pa-none"
              >
                <q-step
                  :name="1"
                  title="Ingressos"
                  icon="confirmation_number"
                  :done="pedido.etapa > 1"
                >
                  <StepIngressos
                    :lotes="lotes"
                    :quantidades="quantidades"
                    :total-ingressos="totalIngressos"
                    @aumentar="aumentar"
                    @diminuir="diminuir"
                    @next="pedido.etapa = 2"
                  />
                </q-step>

                <q-step :name="2" title="Seus Dados" icon="person" :done="pedido.etapa > 2">
                  <StepSeusDados
                    @update:form="Object.assign(form, $event)"
                    @prev="pedido.etapa = 1"
                    @next="pedido.etapa = 3"
                  />
                </q-step>

                <q-step :name="3" title="Resumo" icon="receipt_long" :done="pedido.etapa > 3">
                  <StepResumo
                    :itens="itensSelecionados"
                    :total-valor="totalValor"
                    @prev="pedido.etapa = 2"
                    @next="pedido.etapa = 4"
                  />
                </q-step>

                <q-step :name="4" title="Formulário" icon="assignment" :done="pedido.etapa > 4">
                  <StepIngressoForm
                    :itens="itensSelecionados"
                    :total-valor="totalValor"
                    @prev="pedido.etapa = 3"
                    @next="pedido.etapa = 5"
                  />
                </q-step>

                <q-step :name="5" title="Gerando Pagamento" icon="payment" :done="pedido.etapa > 5">
                  <StepPagamento
                    :forma-pagamento="formaPagamento"
                    :cartao="cartao"
                    :opcoes-parcelas="opcoesParcelas"
                    @update:forma-pagamento="formaPagamento = $event"
                    @update:cartao="Object.assign(cartao, $event)"
                    @prev="pedido.etapa = 4"
                    @next="pedido.etapa = 6"
                    @confirmar="confirmar"
                  />
                </q-step>

                <q-step :name="6" title="Aguardando pagamento" icon="currency_exchange">
                  <StepCobranca
                    :forma-pagamento="formaPagamento"
                    :cartao="cartao"
                    :opcoes-parcelas="opcoesParcelas"
                    @update:forma-pagamento="formaPagamento = $event"
                    @update:cartao="Object.assign(cartao, $event)"
                    @prev="pedido.etapa = 5"
                    @confirmar="confirmar"
                  />
                </q-step>
              </q-stepper>
            </q-tab-panel>

            <q-tab-panel name="pedidos">
              <PedidoPedidos />
            </q-tab-panel>
          </q-tab-panels>
        </div>

        <div class="col">
          <!-- Resumo lateral: somente desktop -->
          <PedidoResumo />
        </div>
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

    <!-- Botões flutuantes: suporte via e-mail e WhatsApp -->
    <div v-if="evento?.suporteTelefone || evento?.suporteEmail" class="suporte-flutuante-wrapper">
      <div v-if="evento?.suporteTelefone" class="suporte-flutuante-row" @click="abrirWhatsapp">
        <div class="suporte-flutuante-label text-grey-9">{{ suporteTelefoneFormatado }}</div>
        <q-btn round unelevated color="positive" icon="mdi-whatsapp" class="suporte-whatsapp-btn">
          <q-tooltip anchor="center left" self="center right">Falar com o suporte</q-tooltip>
        </q-btn>
      </div>

      <div v-if="evento?.suporteEmail" class="suporte-flutuante-row q-mt-md" @click="copiarEmail">
        <div class="suporte-flutuante-label text-grey-9">{{ evento.suporteEmail }}</div>
        <q-btn round flat color="grey-7" size="sm" icon="content_copy">
          <q-tooltip anchor="center left" self="center right">Copiar e-mail</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { useQuasar } from "quasar";
import { PedidoService } from "./pedido.service";
import { useRoute } from "vue-router";
import { usePedidoStore } from "src/stores/pedido";
import { useAuthStore } from "src/stores/auth";

import Cabecalho from "./cabecalho.vue";
import PedidoResumo from "./resumo.vue";
import PedidoPedidos from "./pedidos.vue";
import StepIngressos from "./StepIngressos.vue";
import StepIngressoForm from "./StepIngressoForm.vue";
import StepSeusDados from "./StepSeusDados.vue";
import StepResumo from "./StepResumo.vue";
import StepPagamento from "./StepPagamento.vue";
import StepCobranca from "./StepCobranca.vue";

const OPCOES_PARCELAS = [
  { label: "1× de R$ 80,00 (sem juros)", value: 1 },
  { label: "2× de R$ 40,00 (sem juros)", value: 2 },
  { label: "3× de R$ 26,67 (sem juros)", value: 3 },
];

export default defineComponent({
  name: "PortalEventosPedidoHome",
  components: {
    Cabecalho,
    PedidoResumo,
    PedidoPedidos,
    StepIngressos,
    StepIngressoForm,
    StepSeusDados,
    StepResumo,
    StepPagamento,
    StepCobranca,
  },
  setup() {
    const $q = useQuasar();
    const $authStore = useAuthStore();
    const $route = useRoute();
    const $pedidoStore = usePedidoStore();
    const $service = new PedidoService();

    const data = reactive({
      tab: "ingressos",
      resumoAberto: false,
      evento: computed(() => $pedidoStore.$state.evento),
      pedido: computed(() => $pedidoStore.$state.pedido),
      lotes: [],
      quantidades: {},
      user: computed(() => $authStore.$state.user),
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
      await verificaUsuario();
      await buscaEvento();
    });

    async function verificaUsuario() {
      await $service.verificaUsuario();
    }

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

    function abrirWhatsapp() {
      const telefone = (data.evento?.suporteTelefone ?? "").replace(/\D/g, "");
      if (!telefone) return;
      const mensagem = `Olá, vim da página de inscrição:  ${data.evento?.titulo}`;
      const link = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
      window.open(link, "_blank");
    }

    const suporteTelefoneFormatado = computed(() => {
      const digitos = (data.evento?.suporteTelefone ?? "").replace(/\D/g, "");
      if (digitos.length !== 11) return digitos;
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(3, 7)}-${digitos.slice(7)}`;
    });

    function copiarEmail() {
      const email = data.evento?.suporteEmail;
      if (!email) return;
      void navigator.clipboard.writeText(email);
      $q.notify({ message: "E-mail copiado!", color: "positive" });
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
      abrirWhatsapp,
      suporteTelefoneFormatado,
      copiarEmail,
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

.suporte-flutuante-wrapper {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.suporte-flutuante-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.suporte-flutuante-label {
  background: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.suporte-whatsapp-btn {
  width: 56px;
  height: 56px;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.suporte-copy-btn {
  width: 44px;
  height: 44px;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@media (max-width: 1023px) {
  .page-with-bar {
    padding-bottom: 72px;
  }

  .page-with-bar .suporte-flutuante-wrapper {
    bottom: 88px;
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
