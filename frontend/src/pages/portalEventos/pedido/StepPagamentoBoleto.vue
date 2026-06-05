<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-select
        dense
        outlined
        stack-label
        v-model.number="pagador.numParcelas"
        label="Número de parcelas"
        :options="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
        lazy-rules
        :rules="[(val) => (val && val > 0) || 'Campo obrigatório']"
      />
    </div>
    <div class="col-12 text-grey-8">
      <div class="">Dados para gerar o boleto</div>
      <div>
        <q-radio
          v-model="pagador.tipoPagador"
          val="usuarioLogado"
          label="Dados do usuário logado"
        />
      </div>
      <div>
        <q-radio v-model="pagador.tipoPagador" val="ingresso" label="Dados de cada ingresso" />
      </div>
      <div>
        <q-radio v-model="pagador.tipoPagador" val="avulso" label="Informar dados do pagador" />
      </div>
    </div>
    <div class="col-12" v-if="pagador.tipoPagador === 'avulso'">
      <div class="col-12 col-md-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorNome"
          label="Nome"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorDocumento"
          label="Documento"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorEmail"
          label="Email"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-input
          dense
          outlined
          stack-label
          v-model="pagador.pagadorTelefone"
          label="Telefone"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Campo obrigatório']"
        />
      </div>
    </div>
    <div class="col-12">
      <q-btn
        no-caps
        class="full-width"
        color="primary"
        label="Gerar Pagamento"
        @click="gerarCobranca"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { usePedidoStore } from "src/stores/pedido";

export default defineComponent({
  name: "StepPagamentoBoleto",
  components: {},
  props: {},
  emits: [],
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
      }),
    });

    async function gerarCobranca() {
      data.pagador.pedidoUuid = data.pedido.uuid;
      const response = await $service.gerarCobranca(data.pagador);
    }

    return {
      ...toRefs(data),
      gerarCobranca,
    };
  },
});
</script>
<style scoped></style>
