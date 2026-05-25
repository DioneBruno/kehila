<template>
  <div class="col-md-4 gt-sm">
    <q-card flat bordered class="resumo-sticky">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md row items-center">
          <q-icon name="shopping_cart" class="q-mr-sm" color="primary" />
          Resumo do Pedido
        </div>

        <div v-if="itensSelecionados.length === 0" class="text-center q-py-lg">
          <q-icon name="confirmation_number" size="48px" color="grey-3" />
          <div class="text-caption text-grey-5 q-mt-sm">Nenhum ingresso selecionado</div>
        </div>

        <div v-else>
          <div
            v-for="item in itensSelecionados"
            :key="item.uuid"
            class="row justify-between items-start q-mb-sm"
          >
            <div class="col text-body2">
              <span class="text-weight-medium">{{ item.qtd }}×</span> {{ item.nome }}
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

      <template v-if="itensSelecionados.length > 0">
        <q-separator />
        <q-card-section class="q-py-sm">
          <div class="row items-center q-gutter-xs text-caption text-grey-6">
            <q-icon name="security" size="14px" />
            <span>Compra 100% segura e protegida</span>
          </div>
        </q-card-section>
      </template>
    </q-card>
  </div>
</template>
<script lang="ts">
import { usePedidoStore } from "src/stores/pedido";
import { defineComponent, reactive, toRefs } from "vue";

export default defineComponent({
  name: "PedidoResumo",
  setup() {
    const $pedidoStore = usePedidoStore();

    const data = reactive({});

    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    return {
      ...toRefs(data),
      formatarMoeda,
    };
  },
});
</script>
<style></style>
