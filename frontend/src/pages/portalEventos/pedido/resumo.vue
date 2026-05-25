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
              <!-- <div class="text-caption text-grey-6">{{ totalIngressos }} ingresso(s)</div> -->
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
          <div class="row items-center justify-center q-gutter-xs text-caption text-grey-6">
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
import { computed, defineComponent } from "vue";

export default defineComponent({
  name: "PedidoResumo",
  setup() {
    const $pedidoStore = usePedidoStore();

    function precoDoTipo(uuid: string): number {
      for (const lote of $pedidoStore.evento?.lotes ?? []) {
        const tipos = lote.tiposIngresso ?? lote.tiposEngresso ?? [];
        const tipo = tipos.find((t: any) => t.uuid === uuid);
        if (tipo) return Number(tipo.preco) || 0;
      }
      return 0;
    }

    const itensSelecionados = computed(() =>
      ($pedidoStore.pedido.itens as any[]).map((item) => ({
        uuid: item.tipoIngressoUuid,
        nome: item.tipoIngressoNome,
        qtd: item.quantidade,
        subtotal: item.quantidade * precoDoTipo(item.tipoIngressoUuid),
      })),
    );

    const totalIngressos = computed(() =>
      itensSelecionados.value.reduce((acc, i) => acc + i.qtd, 0),
    );

    const totalValor = computed(() =>
      itensSelecionados.value.reduce((acc, i) => acc + i.subtotal, 0),
    );

    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    return {
      itensSelecionados,
      totalIngressos,
      totalValor,
      formatarMoeda,
    };
  },
});
</script>
<style></style>
