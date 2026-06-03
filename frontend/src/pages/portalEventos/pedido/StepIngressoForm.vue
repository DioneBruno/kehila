<template>
  <div>
    Formulário
    {{ pedido.ingressos }}
    <q-stepper-navigation class="row">
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
      <q-space />
      <q-btn
        unelevated
        color="positive"
        icon="lock"
        label="Confirmar Pedido"
        @click="$emit('confirmar')"
      />
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { usePedidoStore } from "src/stores/pedido";

export default defineComponent({
  name: "PortalEventosPedidoStepIngressoForm",
  components: {},
  setup() {
    const $service = new PedidoService();
    const $pedidoStore = usePedidoStore();

    const data = reactive({
      pedido: computed(() => $pedidoStore.$state.pedido),
    });

    return {
      ...toRefs(data),
    };
  },
});
</script>

<style scoped></style>
