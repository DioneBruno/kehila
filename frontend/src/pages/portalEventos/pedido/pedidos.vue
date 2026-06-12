<template>
  <div class="col-md-4 gt-sm" v-if="user.uuid">
    <q-card flat bordered class="resumo-sticky">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold row items-center justify-between">
          <div class="row items-center">
            <q-icon name="shopping_bag" class="q-mr-sm" color="primary" />
            Meus pedidos
          </div>
          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Novo pedido"
            size="sm"
            @click="novoPedido"
          />
        </div>
      </q-card-section>

      <q-list separator v-if="pedidos.length > 0">
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

            <div v-if="pedido.status === 'pendente'" class="q-mt-sm text-right">
              <q-btn
                flat
                dense
                color="negative"
                icon="cancel"
                label="Cancelar"
                size="sm"
                :loading="cancelando === pedido.uuid"
                @click="confirmarCancelamento(pedido.uuid)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section v-else>
        <div class="text-center text-grey q-py-sm">Nenhum pedido encontrado</div>
      </q-card-section>
    </q-card>
  </div>
</template>
<script lang="ts">
import { useQuasar } from "quasar";
import { computed, defineComponent, onMounted, reactive, ref, toRefs } from "vue";
import { useAuthStore } from "src/stores/auth";
import { usePedidoStore } from "src/stores/pedido";
import { PedidoService } from "./pedido.service";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "PedidoPedidos",
  setup() {
    const $authStore = useAuthStore();
    const $pedidoStore = usePedidoStore();
    const $service = new PedidoService();
    const $route = useRoute();
    const $q = useQuasar();

    const data = reactive({
      user: computed(() => $authStore.$state.user),
      pedidos: ref([] as any),
    });

    const cancelando = ref<string | null>(null);

    onMounted(() => {
      listarPedidos();
    });

    async function listarPedidos() {
      const eventoUuid = $route.params.eventoUuid as string;
      const response = await $service.listarPedidos(eventoUuid);
      data.pedidos = response.data;
    }

    function confirmarCancelamento(pedidoUuid: string) {
      $q.dialog({
        title: "Cancelar pedido",
        message: "Tem certeza que deseja cancelar este pedido?",
        cancel: { label: "Não", flat: true },
        ok: { label: "Sim, cancelar", color: "negative" },
        persistent: true,
      }).onOk(() => {
        cancelando.value = pedidoUuid;
        $service
          .cancelarPedido(pedidoUuid)
          .then(() => {
            listarPedidos();
          })
          .catch(() =>
            $q.notify({ type: "negative", message: "Não foi possível cancelar o pedido." }),
          )
          .finally(() => {
            cancelando.value = null;
          });
      });
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

    function novoPedido() {
      $pedidoStore.$patch((state) => {
        state.pedido = { uuid: "", etapa: 1, itens: [], ingressos: [] };
      });
    }

    return {
      ...toRefs(data),
      cancelando,
      confirmarCancelamento,
      statusColor,
      formatCurrency,
      novoPedido,
    };
  },
});
</script>
<style></style>
