<template>
  <div>
    <div class="q-gutter-md">
      <div class="text-subtitle2 text-grey-7">Forma de pagamento</div>

      <div class="row q-col-gutter-md">
        <div class="col-4">
          <q-card
            flat
            bordered
            class="cursor-pointer"
            :class="formaPagamento === 'boleto' ? 'border-primary bg-grey-1' : ''"
            @click="$emit('update:formaPagamento', 'boleto')"
          >
            <q-card-section class="text-center q-py-md">
              <q-icon name="receipt_long" size="32px" color="blue-9" />
              <div class="text-subtitle2 q-mt-xs text-grey-9">Boleto</div>
              <div class="text-caption text-grey-6">Até 14x sem juros</div>
              <q-icon
                v-if="formaPagamento === 'boleto'"
                name="check_circle"
                color="primary"
                size="18px"
                class="q-mt-xs"
              />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-4">
          <!-- class="cursor-pointer"
          @click="$emit('update:formaPagamento', 'pix')" -->
          <q-card
            flat
            bordered
            :class="formaPagamento === 'pix' ? 'border-primary bg-green-1' : ''"
          >
            <q-card-section class="text-center q-py-md">
              <q-icon name="pix" size="32px" color="grey-5" />
              <div class="text-subtitle2 q-mt-xs text-grey-9">PIX</div>
              <div class="text-caption text-grey-6">Não disponível</div>
              <q-icon
                v-if="formaPagamento === 'pix'"
                name="check_circle"
                color="primary"
                size="18px"
                class="q-mt-xs"
              />
            </q-card-section>
          </q-card>
        </div>

        <div class="col-4">
          <!-- class="cursor-pointer"
          @click="$emit('update:formaPagamento', 'cartao')" -->
          <q-card
            flat
            bordered
            :class="formaPagamento === 'cartao' ? 'border-primary bg-blue-1' : ''"
          >
            <q-card-section class="text-center q-py-md">
              <q-icon name="credit_card" size="32px" color="grey-5" />
              <div class="text-subtitle2 q-mt-xs text-grey-9">Cartão</div>
              <div class="text-caption text-grey-6">Não disponível</div>
              <q-icon
                v-if="formaPagamento === 'cartao'"
                name="check_circle"
                color="primary"
                size="18px"
                class="q-mt-xs"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <StepPagamentoBoleto v-if="formaPagamento === 'boleto'" />

      <q-banner v-if="formaPagamento === 'pix'" rounded class="bg-green-1 text-positive">
        <template v-slot:avatar>
          <q-icon name="info" />
        </template>
        Após confirmar, você receberá o QR Code do PIX. O pedido expira em
        <strong>30 minutos</strong>.
      </q-banner>

      <StepPagamentoCartao
        v-if="formaPagamento === 'cartao'"
        :cartao="cartao"
        :opcoes-parcelas="opcoesParcelas"
        @update:cartao="$emit('update:cartao', $event)"
      />
    </div>

    <q-stepper-navigation class="row">
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
      <q-space />
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import StepPagamentoBoleto from "./StepPagamentoBoleto.vue";
import StepPagamentoCartao from "./StepPagamentoCartao.vue";

interface Cartao {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  parcelas: number;
}

interface OpcaoParcela {
  label: string;
  value: number;
}

export default defineComponent({
  name: "StepPagamento",
  components: {
    StepPagamentoBoleto,
    StepPagamentoCartao,
  },
  props: {
    formaPagamento: { type: String, required: true },
    cartao: { type: Object as PropType<Cartao>, required: true },
    opcoesParcelas: { type: Array as PropType<OpcaoParcela[]>, required: true },
  },
  emits: ["update:formaPagamento", "update:cartao", "prev", "confirmar"],
  setup() {
    return {};
  },
});
</script>

<style scoped>
.border-primary {
  border-color: var(--q-primary) !important;
  border-width: 2px !important;
}
</style>
