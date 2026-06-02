<template>
  <div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">Resumo do Pedido</div>

    <q-list bordered separator class="rounded-borders">
      <q-item v-for="item in itensSelecionados" :key="item.uuid">
        <q-item-section>
          <q-item-label>{{ item.nome }}</q-item-label>
          <q-item-label caption
            >{{ item.qtd }} × {{ formatarMoeda(item.subtotal / item.qtd) }}</q-item-label
          >
        </q-item-section>
        <q-item-section side>
          <q-item-label class="text-weight-medium">{{ formatarMoeda(item.subtotal) }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-card flat bordered class="q-mt-md">
      <q-card-section class="row items-center justify-between q-py-sm">
        <span class="text-subtitle1 text-weight-bold">Total</span>
        <span class="text-subtitle1 text-weight-bold text-primary">{{
          formatarMoeda(totalValor)
        }}</span>
      </q-card-section>
    </q-card>

    <q-stepper-navigation class="row">
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
      <q-space />
      <q-btn
        unelevated
        label="Continuar"
        color="primary"
        icon-right="chevron_right"
        @click="$emit('next')"
      />
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { usePedidoStore } from "src/stores/pedido";
import type { PropType } from "vue";
import { computed, defineComponent } from "vue";

interface ItemResumo {
  uuid: string;
  nome: string;
  qtd: number;
  subtotal: number;
}

export default defineComponent({
  name: "StepResumo",
  props: {
    itens: { type: Array as PropType<ItemResumo[]>, required: true },
    totalValor: { type: Number, required: true },
  },
  emits: ["prev", "next"],
  setup() {
    const $pedidoStore = usePedidoStore();

    function precoDoTipo(uuid: string): number {
      for (const lote of $pedidoStore.evento?.lotes ?? []) {
        const tipos = lote.tiposIngresso ?? lote.tiposIngresso ?? [];
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
