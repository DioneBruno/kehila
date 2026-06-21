<template>
  <div class="row q-col-gutter-md q-mt-md">
    <div class="col-12">
      <q-separator />
    </div>
    <!-- <div class="col-12">
      <q-input
        v-model="pagador.cartao.numero"
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
        v-model="pagador.cartao.nome"
        label="Nome no cartão"
        outlined
        placeholder="Como está impresso"
      />
    </div>
    <div class="col-6">
      <q-input
        v-model="pagador.cartao.validade"
        label="Validade"
        outlined
        mask="##/##"
        placeholder="MM/AA"
      />
    </div>
    <div class="col-6">
      <q-input v-model="pagador.cartao.cvv" label="CVV" outlined mask="###" type="password" />
    </div>
    <div class="col-12">
      <q-select
        v-model="pagador.numParcelas"
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
    </div> -->
    <div class="col-12">
      <q-btn
        no-caps
        flat
        color="primary"
        icon="add"
        label="Incluir Cartão de Credito"
        class="full-width"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { usePedidoStore } from "src/stores/pedido";
import { useAuthStore } from "src/stores/auth";

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
    const $authStore = useAuthStore();

    const data = reactive({
      user: computed(() => $authStore.$state.user),
      pedido: computed(() => $pedidoStore.$state.pedido),
      pagador: ref({
        pedidoUuid: null as string | null,
        numParcelas: 1,
        tipoPagador: "usuarioLogado",
        pagadorNome: "",
        pagadorDocumento: "",
        pagadorEmail: "",
        pagadorTelefone: "",
        cartao: reactive({
          numero: "",
          nome: "",
          validade: "",
          cvv: "",
        }),
      }),
    });

    async function gerarCobranca() {
      data.pagador.pedidoUuid = data.pedido.uuid;
      const [mes, ano] = data.pagador.cartao.validade.split("/");
      const payload = {
        pedidoUuid: data.pagador.pedidoUuid,
        numParcelas: data.pagador.numParcelas,
        tipoPagador: data.pagador.tipoPagador,
        tipoCobranca: "cartaoCredito",
        cartaoCredito: {
          numeroCartao: data.pagador.cartao.numero.replace(/\s/g, ""),
          nomeNoCartao: data.pagador.cartao.nome,
          mesVencimento: mes,
          anoVencimento: ano,
          codigoSeguranca: data.pagador.cartao.cvv,
        },
      };
      await $service.gerarCobranca(payload);
    }

    return {
      ...toRefs(data),
      gerarCobranca,
    };
  },
});
</script>
