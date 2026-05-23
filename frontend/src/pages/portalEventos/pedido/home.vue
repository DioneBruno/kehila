<template>
  <q-page class="bg-grey-2">
    <!-- Hero do evento -->
    <div class="bg-primary text-white">
      <div class="hero-container q-px-md q-py-xl">
        <div class="row items-center q-col-gutter-lg">
          <div class="col-auto gt-xs">
            <q-avatar size="80px" color="white" text-color="primary" square class="rounded-borders">
              <q-icon name="event" size="48px" />
            </q-avatar>
          </div>
          <div class="col">
            <div class="text-overline q-mb-xs" style="opacity: 0.75">Portal de Ingressos</div>
            <div class="text-h5 text-weight-bold">{{ evento.titulo }}</div>
            <div class="row items-center q-gutter-md q-mt-sm text-body2 flex-wrap">
              <span class="row items-center no-wrap">
                <q-icon name="event" size="16px" class="q-mr-xs" />
                {{ evento.data }}
              </span>
              <span class="row items-center no-wrap">
                <q-icon name="schedule" size="16px" class="q-mr-xs" />
                {{ evento.horario }}
              </span>
              <span class="row items-center no-wrap">
                <q-icon name="location_on" size="16px" class="q-mr-xs" />
                {{ evento.local }}
              </span>
            </div>
          </div>
          <div class="col-auto">
            <q-chip color="positive" text-color="white" icon="circle" dense>Em Vendas</q-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo principal -->
    <div class="hero-container q-px-md q-py-lg">
      <div class="row q-col-gutter-lg">

        <!-- Stepper de compra -->
        <div class="col-12 col-md-8">
          <q-stepper v-model="etapa" animated color="primary" flat bordered>

            <!-- Etapa 1: Seleção de ingressos -->
            <q-step :name="1" title="Ingressos" icon="confirmation_number" :done="etapa > 1">
              <div v-if="lotes.length === 0" class="text-center q-py-xl">
                <q-icon name="confirmation_number" size="56px" color="grey-4" />
                <div class="text-subtitle1 text-grey-5 q-mt-md">Nenhum ingresso disponível</div>
              </div>

              <div v-else class="q-gutter-md">
                <div v-for="lote in lotes" :key="lote.uuid">
                  <div class="row items-center q-mb-sm">
                    <span class="text-overline text-grey-7 text-weight-bold">{{ lote.nome }}</span>
                    <q-separator class="col q-ml-sm" />
                  </div>

                  <q-card
                    v-for="tipo in lote.tiposIngresso"
                    :key="tipo.uuid"
                    flat
                    bordered
                    class="q-mb-sm"
                    :class="{ 'bg-blue-1': (quantidades[tipo.uuid] ?? 0) > 0 }"
                  >
                    <q-card-section class="q-py-sm">
                      <div class="row items-center no-wrap">
                        <div class="col">
                          <div class="text-subtitle1 text-weight-medium">{{ tipo.nome }}</div>
                          <div v-if="tipo.descricao" class="text-caption text-grey-6 q-mb-xs">
                            {{ tipo.descricao }}
                          </div>
                          <div class="text-h6 text-primary">{{ formatarMoeda(tipo.preco) }}</div>
                          <div class="text-caption text-grey-5">
                            {{ tipo.disponivel }} disponíveis
                          </div>
                        </div>
                        <div class="col-auto">
                          <div class="row items-center q-gutter-xs">
                            <q-btn
                              round
                              unelevated
                              size="sm"
                              icon="remove"
                              color="primary"
                              :disable="(quantidades[tipo.uuid] ?? 0) === 0"
                              @click="diminuir(tipo.uuid)"
                            />
                            <div
                              class="text-h6 text-center text-weight-bold"
                              style="min-width: 36px"
                            >
                              {{ quantidades[tipo.uuid] ?? 0 }}
                            </div>
                            <q-btn
                              round
                              unelevated
                              size="sm"
                              icon="add"
                              color="primary"
                              :disable="(quantidades[tipo.uuid] ?? 0) >= tipo.disponivel"
                              @click="aumentar(tipo.uuid, tipo)"
                            />
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <q-stepper-navigation class="q-pt-md">
                <q-btn
                  unelevated
                  color="primary"
                  label="Continuar"
                  icon-right="chevron_right"
                  :disable="totalIngressos === 0"
                  @click="etapa = 2"
                />
              </q-stepper-navigation>
            </q-step>

            <!-- Etapa 2: Dados pessoais -->
            <q-step :name="2" title="Seus Dados" icon="person" :done="etapa > 2">
              <q-form ref="formDados" @submit.prevent="etapa = 3" greedy>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-input
                      v-model="form.nome"
                      label="Nome completo *"
                      outlined
                      :rules="[(v) => !!v || 'Obrigatório']"
                      lazy-rules
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.email"
                      label="E-mail *"
                      type="email"
                      outlined
                      :rules="[(v) => !!v || 'Obrigatório']"
                      lazy-rules
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.celular"
                      label="Celular *"
                      outlined
                      mask="(##) #####-####"
                      unmasked-value
                      :rules="[(v) => !!v || 'Obrigatório']"
                      lazy-rules
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.cpf"
                      label="CPF *"
                      outlined
                      mask="###.###.###-##"
                      unmasked-value
                      :rules="[(v) => !!v || 'Obrigatório']"
                      lazy-rules
                    />
                  </div>
                </div>

                <q-stepper-navigation class="row q-gutter-sm q-pt-md">
                  <q-btn flat label="Voltar" color="grey-7" @click="etapa = 1" />
                  <q-btn
                    unelevated
                    type="submit"
                    label="Continuar"
                    color="primary"
                    icon-right="chevron_right"
                  />
                </q-stepper-navigation>
              </q-form>
            </q-step>

            <!-- Etapa 3: Pagamento -->
            <q-step :name="3" title="Pagamento" icon="payment">
              <div class="q-gutter-md">
                <div class="text-subtitle2 text-grey-7">Forma de pagamento</div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer"
                      :class="formaPagamento === 'pix' ? 'border-primary bg-green-1' : ''"
                      @click="formaPagamento = 'pix'"
                    >
                      <q-card-section class="text-center q-py-lg">
                        <q-icon name="pix" size="36px" color="positive" />
                        <div class="text-subtitle2 q-mt-sm">PIX</div>
                        <div class="text-caption text-grey-6">Aprovação imediata</div>
                        <q-chip
                          v-if="formaPagamento === 'pix'"
                          size="sm"
                          color="primary"
                          text-color="white"
                          icon="check"
                          class="q-mt-sm"
                        >
                          Selecionado
                        </q-chip>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer"
                      :class="formaPagamento === 'cartao' ? 'border-primary bg-blue-1' : ''"
                      @click="formaPagamento = 'cartao'"
                    >
                      <q-card-section class="text-center q-py-lg">
                        <q-icon name="credit_card" size="36px" color="primary" />
                        <div class="text-subtitle2 q-mt-sm">Cartão de Crédito</div>
                        <div class="text-caption text-grey-6">Até 12× sem juros</div>
                        <q-chip
                          v-if="formaPagamento === 'cartao'"
                          size="sm"
                          color="primary"
                          text-color="white"
                          icon="check"
                          class="q-mt-sm"
                        >
                          Selecionado
                        </q-chip>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <!-- PIX: instrução -->
                <q-banner v-if="formaPagamento === 'pix'" rounded class="bg-green-1 text-positive">
                  <template v-slot:avatar>
                    <q-icon name="info" />
                  </template>
                  Após confirmar, você receberá o QR Code do PIX para realizar o pagamento. O pedido
                  expira em <strong>30 minutos</strong>.
                </q-banner>

                <!-- Cartão: formulário -->
                <div v-if="formaPagamento === 'cartao'" class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-input
                      v-model="cartao.numero"
                      label="Número do cartão"
                      outlined
                      mask="#### #### #### ####"
                      placeholder="0000 0000 0000 0000"
                    >
                      <template v-slot:append>
                        <q-icon name="credit_card" color="grey-5" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12">
                    <q-input
                      v-model="cartao.nome"
                      label="Nome no cartão"
                      outlined
                      placeholder="Como está impresso"
                    />
                  </div>
                  <div class="col-6">
                    <q-input
                      v-model="cartao.validade"
                      label="Validade"
                      outlined
                      mask="##/##"
                      placeholder="MM/AA"
                    />
                  </div>
                  <div class="col-6">
                    <q-input
                      v-model="cartao.cvv"
                      label="CVV"
                      outlined
                      mask="###"
                      type="password"
                    />
                  </div>
                  <div class="col-12">
                    <q-select
                      v-model="cartao.parcelas"
                      label="Parcelas"
                      outlined
                      :options="opcoesParcelas"
                      emit-value
                      map-options
                    />
                  </div>
                </div>
              </div>

              <q-stepper-navigation class="row q-gutter-sm q-pt-md">
                <q-btn flat label="Voltar" color="grey-7" @click="etapa = 2" />
                <q-btn
                  unelevated
                  color="positive"
                  icon="lock"
                  label="Confirmar Pedido"
                  :disable="!formaPagamento"
                  @click="confirmar"
                />
              </q-stepper-navigation>
            </q-step>
          </q-stepper>
        </div>

        <!-- Resumo do pedido -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="resumo-sticky">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold q-mb-md row items-center">
                <q-icon name="shopping_cart" class="q-mr-sm" color="primary" />
                Resumo do Pedido
              </div>

              <div v-if="itensSelecionados.length === 0" class="text-center q-py-lg">
                <q-icon name="confirmation_number" size="48px" color="grey-3" />
                <div class="text-caption text-grey-5 q-mt-sm">
                  Nenhum ingresso selecionado
                </div>
              </div>

              <div v-else>
                <div
                  v-for="item in itensSelecionados"
                  :key="item.uuid"
                  class="row justify-between items-start q-mb-sm"
                >
                  <div class="col text-body2">
                    <span class="text-weight-medium">{{ item.qtd }}×</span>
                    {{ item.nome }}
                  </div>
                  <div class="col-auto text-body2 text-weight-medium">
                    {{ formatarMoeda(item.subtotal) }}
                  </div>
                </div>

                <q-separator class="q-my-md" />

                <div class="row justify-between items-center">
                  <div>
                    <div class="text-caption text-grey-6">{{ totalIngressos }} ingresso(s)</div>
                    <div class="text-subtitle2 text-weight-bold">Total</div>
                  </div>
                  <div class="text-h6 text-primary text-weight-bold">
                    {{ formatarMoeda(totalValor) }}
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator v-if="itensSelecionados.length > 0" />

            <q-card-section v-if="itensSelecionados.length > 0" class="q-pt-sm">
              <div class="row items-start q-gutter-xs text-caption text-grey-6">
                <q-icon name="security" size="14px" class="q-mt-xs" />
                <span>Compra 100% segura e protegida</span>
              </div>
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from "vue";

const LOTES_MOCK = [
  {
    uuid: "lote-1",
    nome: "1º Lote",
    tiposIngresso: [
      { uuid: "tipo-1", nome: "Inteira", descricao: "", preco: 80, disponivel: 50 },
      { uuid: "tipo-2", nome: "Meia-entrada", descricao: "Estudantes com carteirinha", preco: 40, disponivel: 20 },
    ],
  },
  {
    uuid: "lote-2",
    nome: "VIP",
    tiposIngresso: [
      { uuid: "tipo-3", nome: "VIP", descricao: "Acesso à área exclusiva + open bar", preco: 200, disponivel: 10 },
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
  setup() {
    const data = reactive({
      etapa: 1,
      evento: {
        titulo: "Evento de Exemplo",
        data: "28/06/2026",
        horario: "19h00",
        local: "Centro de Convenções",
      },
      lotes: LOTES_MOCK,
      quantidades: {} as Record<string, number>,
      form: {
        nome: "",
        email: "",
        celular: "",
        cpf: "",
      },
      formaPagamento: "" as "pix" | "cartao" | "",
      cartao: {
        numero: "",
        nome: "",
        validade: "",
        cvv: "",
        parcelas: 1,
      },
      opcoesParcelas: OPCOES_PARCELAS,
    });

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
      if (atual < tipo.disponivel) {
        data.quantidades[uuid] = atual + 1;
      }
    }

    function diminuir(uuid: string) {
      const atual = data.quantidades[uuid] ?? 0;
      if (atual > 0) {
        data.quantidades[uuid] = atual - 1;
      }
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

.border-primary {
  border-color: var(--q-primary) !important;
  border-width: 2px !important;
}
</style>
