<template>
  <div v-if="user.uuid">
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

      <q-separator class="q-mb-md" />

      <q-list separator dense v-if="pedidos.length > 0">
        <q-item
          clickable
          dense
          v-for="pedido in pedidos"
          :key="pedido.uuid"
          class="q-py-md"
          :active="pedido.uuid === pedidoAtivoUuid"
          active-class="bg-primary-soft"
          @click="selecionarPedido(pedido.uuid)"
        >
          <q-item-section side>
            <q-icon
              name="circle"
              size="10px"
              :color="`${pedido.uuid === pedidoAtivoUuid ? `grey-10` : 'grey-3'}`"
            />
          </q-item-section>
          <q-item-section>
            <div class="row items-center justify-between q-mb-xs">
              <q-chip
                square
                size="sm"
                :color="statusInfo(pedido.status).color"
                :text-color="statusInfo(pedido.status).textColor"
                class="text-capitalize q-ma-none"
              >
                {{ statusInfo(pedido.status).label }}
              </q-chip>
              <span class="text-weight-bold text-primary">
                {{ formatCurrency(pedido.valorLiquido) }}
              </span>
            </div>

            <q-item-label caption class="q-mt-xs">
              <q-icon name="event" size="12px" class="q-mr-xs" />
              Criado em: {{ formatData(pedido.createdAt) }}
            </q-item-label>

            <q-item-label caption v-if="pedido.pagoEm">
              <q-icon name="check_circle" size="12px" color="positive" class="q-mr-xs" />
              Pago em: {{ formatData(pedido.pagoEm) }}
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
                @click.stop="confirmarCancelamento(pedido.uuid)"
              />
            </div>

            <q-slide-transition>
              <div
                v-show="pedido.uuid === pedidoAtivoUuid"
                class="bg-grey-1 q-mt-sm q-pa-md rounded-borders"
              >
                <StepCobranca />
              </div>
            </q-slide-transition>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section v-else>
        <div class="text-center text-grey q-py-sm">Nenhum pedido encontrado</div>
      </q-card-section>
    </q-card>
  </div>

  <q-card v-else flat bordered class="q-pa-md">
    <div class="text-subtitle1 text-weight-bold row items-center q-mb-md">
      <!-- <q-icon name="login" class="q-mr-sm" color="primary" /> -->
      Entre ou cadastre-se para ver seus pedidos
    </div>
    <LoginCadastro form-inicial="login" />
  </q-card>
</template>
<script lang="ts">
import { useQuasar } from "quasar";
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watch } from "vue";
import { useAuthStore } from "src/stores/auth";
import { usePedidoStore } from "src/stores/pedido";
import { PedidoService } from "./pedido.service";
import { useRoute } from "vue-router";
import { ApiDate } from "src/shared/apiDate.service";
import LoginCadastro from "./LoginCadastro.vue";
import StepCobranca from "./StepCobranca.vue";

export default defineComponent({
  name: "PedidoPedidos",
  components: { LoginCadastro, StepCobranca },
  setup() {
    const $authStore = useAuthStore();
    const $pedidoStore = usePedidoStore();
    const $service = new PedidoService();
    const $route = useRoute();
    const $q = useQuasar();

    const data = reactive({
      user: computed(() => $authStore.$state.user),
      pedido: computed(() => $pedidoStore.$state.pedido),
      pedidos: ref([] as any),
    });

    const cancelando = ref<string | null>(null);

    onMounted(() => {
      listarPedidos();
    });

    watch(
      () => data.user.uuid,
      (uuid, uuidAnterior) => {
        if (uuid && !uuidAnterior) void listarPedidos();
      },
    );

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

    function statusInfo(status: string): { label: string; color: string; textColor: string } {
      const textColor = "blue-grey-10";
      const map: Record<string, { label: string; color: string; textColor: string }> = {
        pago: { label: "Pago", color: "green-2", textColor },
        pendente: { label: "Pendente", color: "orange-2", textColor },
        pagamento_gerado: { label: "Pagamento Pendente", color: "blue-2", textColor },
        cancelado: { label: "Cancelado", color: "red-2", textColor },
      };
      return map[status] ?? { label: status, color: "grey-3", textColor };
    }

    function formatCurrency(value: number): string {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        value ?? 0,
      );
    }

    function formatData(data: string) {
      return ApiDate.format(data, "DD/MM/YYYY HH:mm");
    }

    const pedidoAtivoUuid = computed(() => $pedidoStore.$state.pedido.uuid);

    async function selecionarPedido(pedidoUuid: string) {
      await $service.buscarPedido(pedidoUuid);
    }

    function novoPedido() {
      $pedidoStore.$patch((state) => {
        state.pedido = { uuid: "", etapa: 1, itens: [], ingressos: [] };
      });
      data.pedido.tab = "ingressos";
    }

    return {
      ...toRefs(data),
      cancelando,
      pedidoAtivoUuid,
      confirmarCancelamento,
      selecionarPedido,
      statusInfo,
      formatCurrency,
      novoPedido,
      formatData,
    };
  },
});
</script>
<style scoped>
.bg-primary-soft {
  background-color: rgba(var(--q-primary-rgb, 25, 118, 210), 0.08);
}
</style>
