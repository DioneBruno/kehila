<template>
  <div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">Resumo da compra</div>

    <q-list bordered separator class="rounded-borders">
      <q-item v-for="item in itens" :key="item.uuid">
        <q-item-section>
          <q-item-label>{{ item.nome }}</q-item-label>
          <q-item-label caption>{{ item.qtd }} × {{ formatarMoeda(item.subtotal / item.qtd) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label class="text-weight-medium">{{ formatarMoeda(item.subtotal) }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-card flat bordered class="q-mt-md">
      <q-card-section class="row items-center justify-between q-py-sm">
        <span class="text-subtitle1 text-weight-bold">Total</span>
        <span class="text-subtitle1 text-weight-bold text-primary">{{ formatarMoeda(totalValor) }}</span>
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
import type { PropType } from "vue";
import { defineComponent } from "vue";

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
    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
    return { formatarMoeda };
  },
});
</script>
