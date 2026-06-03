<template>
  <div class="col-md-4 gt-sm" v-if="user.uuid">
    <q-card flat bordered class="resumo-sticky">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md row items-center">
          <q-icon name="shopping_bag" class="q-mr-sm" color="primary" />
          Meus pedidos
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { useAuthStore } from "src/stores/auth";
import { PedidoService } from "./pedido.service";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "PedidoPedidos",
  setup() {
    const $authStore = useAuthStore();
    const $service = new PedidoService();
    const $route = useRoute();

    const data = reactive({
      user: computed(() => $authStore.$state.user),
    });

    onMounted(() => {
      listarPedidos();
    });

    async function listarPedidos() {
      const eventoUuid = $route.params.eventoUuid as string;
      const pedidos = await $service.listarPedidos(eventoUuid);
      console.log(pedidos);
    }

    return {
      ...toRefs(data),
    };
  },
});
</script>
<style></style>
