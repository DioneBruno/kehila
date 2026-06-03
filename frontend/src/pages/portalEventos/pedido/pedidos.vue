<template>
  <div class="col-md-4 gt-sm" v-if="user.uuid">
    <span v-if="pedidos.length > 0">
      <q-card flat bordered class="resumo-sticky">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold row items-center">
            <q-icon name="shopping_bag" class="q-mr-sm" color="primary" />
            Meus pedidos
          </div>
        </q-card-section>

        <q-list separator>
          <q-item v-for="pedido in pedidos" :key="pedido.uuid" class="q-py-md">
            <q-item-section>
              <div class="row items-center justify-between q-mb-xs">
                <q-chip
                  dense
                  size="sm"
                  :color="statusColor(pedido.status)"
                  text-color="white"
                  class="text-capitalize q-ma-none"
                >
                  {{ pedido.status }}
                </q-chip>
                <span class="text-weight-bold text-primary">
                  {{ formatCurrency(pedido.valorLiquido) }}
                </span>
              </div>

              <q-item-label caption class="q-mt-xs">
                <q-icon name="event" size="12px" class="q-mr-xs" />
                Criado em: {{ pedido.createdAt }}
              </q-item-label>

              <q-item-label caption v-if="pedido.pagoEm">
                <q-icon name="check_circle" size="12px" color="positive" class="q-mr-xs" />
                Pago em: {{ pedido.pagoEm }}
              </q-item-label>

              <q-item-label caption>
                <q-icon name="confirmation_number" size="12px" class="q-mr-xs" />
                {{ pedido.quantidadeIngressos }} ingresso{{
                  pedido.quantidadeIngressos !== 1 ? "s" : ""
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="pedidos.length === 0">
            <q-item-section class="text-center text-grey q-py-md">
              Nenhum pedido encontrado
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </span>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs } from "vue";
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
      pedidos: ref([] as any),
    });

    onMounted(() => {
      listarPedidos();
    });

    async function listarPedidos() {
      const eventoUuid = $route.params.eventoUuid as string;
      const response = await $service.listarPedidos(eventoUuid);
      data.pedidos = response.data;
    }

    function statusColor(status: string): string {
      const map: Record<string, string> = {
        pago: "positive",
        pendente: "warning",
        cancelado: "negative",
      };
      return map[status] ?? "grey";
    }

    function formatCurrency(value: number): string {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        value ?? 0,
      );
    }

    return {
      ...toRefs(data),
      statusColor,
      formatCurrency,
    };
  },
});
</script>
<style></style>
