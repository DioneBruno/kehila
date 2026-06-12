<template>
  <div class="row q-col-gutter-md">
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
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";

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
  name: "StepPagamentoCartao",
  props: {
    cartao: { type: Object as PropType<Cartao>, required: true },
    opcoesParcelas: { type: Array as PropType<OpcaoParcela[]>, required: true },
  },
  emits: ["update:cartao"],
  setup(props, { emit }) {
    function updateCartao(campo: keyof Cartao, valor: string | number) {
      emit("update:cartao", { ...props.cartao, [campo]: valor });
    }
    return { updateCartao };
  },
});
</script>
