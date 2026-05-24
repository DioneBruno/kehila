<template>
  <div>
    <div class="q-gutter-md">
      <div class="text-subtitle2 text-grey-7">Forma de pagamento</div>

      <div class="row q-col-gutter-md">
        <div class="col-6">
          <q-card
            flat
            bordered
            class="cursor-pointer"
            :class="formaPagamento === 'pix' ? 'border-primary bg-green-1' : ''"
            @click="$emit('update:formaPagamento', 'pix')"
          >
            <q-card-section class="text-center q-py-md">
              <q-icon name="pix" size="32px" color="positive" />
              <div class="text-subtitle2 q-mt-xs">PIX</div>
              <div class="text-caption text-grey-6">Aprovação imediata</div>
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

        <div class="col-6">
          <q-card
            flat
            bordered
            class="cursor-pointer"
            :class="formaPagamento === 'cartao' ? 'border-primary bg-blue-1' : ''"
            @click="$emit('update:formaPagamento', 'cartao')"
          >
            <q-card-section class="text-center q-py-md">
              <q-icon name="credit_card" size="32px" color="primary" />
              <div class="text-subtitle2 q-mt-xs">Cartão</div>
              <div class="text-caption text-grey-6">Até 12× sem juros</div>
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

      <q-banner v-if="formaPagamento === 'pix'" rounded class="bg-green-1 text-positive">
        <template v-slot:avatar>
          <q-icon name="info" />
        </template>
        Após confirmar, você receberá o QR Code do PIX. O pedido expira em
        <strong>30 minutos</strong>.
      </q-banner>

      <div v-if="formaPagamento === 'cartao'" class="row q-col-gutter-md">
        <div class="col-12">
          <q-input
            :model-value="cartao.numero"
            label="Número do cartão"
            outlined
            mask="#### #### #### ####"
            placeholder="0000 0000 0000 0000"
            @update:model-value="updateCartao('numero', $event)"
          >
            <template v-slot:append>
              <q-icon name="credit_card" color="grey-5" />
            </template>
          </q-input>
        </div>
        <div class="col-12">
          <q-input
            :model-value="cartao.nome"
            label="Nome no cartão"
            outlined
            placeholder="Como está impresso"
            @update:model-value="updateCartao('nome', $event)"
          />
        </div>
        <div class="col-6">
          <q-input
            :model-value="cartao.validade"
            label="Validade"
            outlined
            mask="##/##"
            placeholder="MM/AA"
            @update:model-value="updateCartao('validade', $event)"
          />
        </div>
        <div class="col-6">
          <q-input
            :model-value="cartao.cvv"
            label="CVV"
            outlined
            mask="###"
            type="password"
            @update:model-value="updateCartao('cvv', $event)"
          />
        </div>
        <div class="col-12">
          <q-select
            :model-value="cartao.parcelas"
            label="Parcelas"
            outlined
            :options="opcoesParcelas"
            emit-value
            map-options
            @update:model-value="updateCartao('parcelas', $event)"
          />
        </div>
      </div>
    </div>

    <q-stepper-navigation class="row q-gutter-sm q-pt-md">
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
      <q-btn
        unelevated
        color="positive"
        icon="lock"
        label="Confirmar Pedido"
        :disable="!formaPagamento"
        @click="$emit('confirmar')"
      />
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

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
  props: {
    formaPagamento: { type: String, required: true },
    cartao: { type: Object as PropType<Cartao>, required: true },
    opcoesParcelas: { type: Array as PropType<OpcaoParcela[]>, required: true },
  },
  emits: ["update:formaPagamento", "update:cartao", "prev", "confirmar"],
  setup(props, { emit }) {
    function updateCartao(campo: keyof Cartao, valor: string | number) {
      emit("update:cartao", { ...props.cartao, [campo]: valor });
    }
    return { updateCartao };
  },
});
</script>

<style scoped>
.border-primary {
  border-color: var(--q-primary) !important;
  border-width: 2px !important;
}
</style>
