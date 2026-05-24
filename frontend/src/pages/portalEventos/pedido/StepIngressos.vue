<template>
  <div>
    <div v-if="lotes.length === 0" class="text-center q-py-xl">
      <q-icon name="confirmation_number" size="56px" color="grey-4" />
      <div class="text-subtitle1 text-grey-5 q-mt-md">Nenhum ingresso disponível</div>
    </div>

    <div v-else class="q-gutter-md">
      <div v-for="lote in lotes" :key="lote.uuid">
        <div class="row items-center q-mb-sm">
          <span class="text-overline text-grey-7 text-weight-bold">{{ lote.nome }}</span>
          <q-separator class="col q-ml-sm" />
        </div>

        <q-card
          v-for="tipo in lote.tiposIngresso"
          :key="tipo.uuid"
          flat
          bordered
          class="q-mb-sm"
          :class="{ 'bg-blue-1': (quantidades[tipo.uuid] ?? 0) > 0 }"
        >
          <q-card-section class="q-py-sm">
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-subtitle2 text-weight-medium">{{ tipo.nome }}</div>
                <div v-if="tipo.descricao" class="text-caption text-grey-6 q-mb-xs">
                  {{ tipo.descricao }}
                </div>
                <div class="text-subtitle1 text-primary text-weight-bold">
                  {{ formatarMoeda(tipo.preco) }}
                </div>
                <div class="text-caption text-grey-5">{{ tipo.disponivel }} disponíveis</div>
              </div>
              <div class="col-auto">
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    round
                    unelevated
                    size="sm"
                    icon="remove"
                    color="primary"
                    :disable="(quantidades[tipo.uuid] ?? 0) === 0"
                    @click="$emit('diminuir', tipo.uuid)"
                  />
                  <div class="text-h6 text-center text-weight-bold" style="min-width: 36px">
                    {{ quantidades[tipo.uuid] ?? 0 }}
                  </div>
                  <q-btn
                    round
                    unelevated
                    size="sm"
                    icon="add"
                    color="primary"
                    :disable="(quantidades[tipo.uuid] ?? 0) >= tipo.disponivel"
                    @click="$emit('aumentar', tipo.uuid, tipo)"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-stepper-navigation class="q-pt-md">
      <q-btn
        unelevated
        color="primary"
        label="Continuar"
        icon-right="chevron_right"
        :disable="totalIngressos === 0"
        @click="$emit('next')"
      />
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

interface TipoIngresso {
  uuid: string;
  nome: string;
  descricao: string;
  preco: number;
  disponivel: number;
}

interface Lote {
  uuid: string;
  nome: string;
  tiposIngresso: TipoIngresso[];
}

export default defineComponent({
  name: "StepIngressos",
  props: {
    lotes: { type: Array as PropType<Lote[]>, required: true },
    quantidades: { type: Object as PropType<Record<string, number>>, required: true },
    totalIngressos: { type: Number, required: true },
  },
  emits: ["aumentar", "diminuir", "next"],
  setup() {
    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
    return { formatarMoeda };
  },
});
</script>
