<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-input
        :model-value="pagador.cartao.numero"
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
        :model-value="pagador.cartao.nome"
        label="Nome no cartão"
        outlined
        placeholder="Como está impresso"
      />
    </div>
    <div class="col-6">
      <q-input
        :model-value="pagador.cartao.validade"
        label="Validade"
        outlined
        mask="##/##"
        placeholder="MM/AA"
      />
    </div>
    <div class="col-6">
      <q-input :model-value="pagador.cartao.cvv" label="CVV" outlined mask="###" type="password" />
    </div>
    <div class="col-12">
      <q-select
        :model-value="pagador.numParcelas"
        label="Parcelas"
        outlined
        :options="opcoesParcelas"
        emit-value
        map-options
      />
    </div>
    <div class="col-12 row justify-end">
      <q-btn
        no-caps
        class="full-width"
        label="Confirmar pagamento"
        color="primary"
        icon="credit_card"
        @click="gerarCobranca"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { usePedidoStore } from "src/stores/pedido";

interface OpcaoParcela {
  label: string;
  value: number;
}

export default defineComponent({
  name: "StepPagamentoCartao",
  props: {
    opcoesParcelas: { type: Array as PropType<OpcaoParcela[]>, required: true },
  },
  emits: ["update:cartao"],
  setup(props, { emit }) {
    const $service = new PedidoService();
    const $pedidoStore = usePedidoStore();

    const data = reactive({
      pedido: computed(() => $pedidoStore.$state.pedido),
      pagador: ref({
        pedidoUuid: null,
        numParcelas: 1,
        tipoPagador: "usuarioLogado",
        pagadorNome: "",
        pagadorDocumento: "",
        pagadorEmail: "",
        pagadorTelefone: "",
        cartao: ref({} as any),
      }),
    });

    async function gerarCobranca() {
      data.pagador.pedidoUuid = data.pedido.uuid;
      await $service.gerarCobranca(data.pagador);
    }

    return {
      ...toRefs(data),
      gerarCobranca,
    };
  },
});
</script>
