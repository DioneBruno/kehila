<template>
  <div class="bg-primary text-white">
    <div class="hero-container q-px-md q-py-lg">
      <div class="row items-center q-col-gutter-md">
        <div class="col-auto gt-xs">
          <q-avatar size="72px" color="white" text-color="primary" square class="rounded-borders">
            <q-icon name="event" size="44px" />
          </q-avatar>
        </div>
        <div class="col">
          <div class="text-overline q-mb-xs" style="opacity: 0.75">Portal de Ingressos</div>
          <div class="text-h6 text-weight-bold">{{ evento.titulo }}</div>
          <div class="row items-center q-gutter-sm q-mt-xs text-caption flex-wrap">
            <span class="row items-center no-wrap">
              <q-icon name="event" size="13px" class="q-mr-xs" />{{
                formatDate(evento.dataInicio, "DD/MM/YYYY")
              }}
            </span>
            <span class="row items-center no-wrap">
              <q-icon name="schedule" size="13px" class="q-mr-xs" />{{
                formatDate(evento.dataInicio, "HH:mm")
              }}
            </span>
            <span class="row items-center no-wrap">
              <q-icon name="location_on" size="13px" class="q-mr-xs" />{{ evento.localNome }}
            </span>
          </div>
          <!-- <div class="row items-center q-gutter-sm q-mt-xs text-caption flex-wrap">
            <span>
              {{ evento.localEndereco }}
            </span>
          </div> -->
        </div>
        <div class="col-auto">
          <q-chip color="positive" text-color="white" icon="circle" dense>Em Vendas</q-chip>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { ApiDate } from "src/shared/apiDate.service";
import { usePedidoStore } from "src/stores/pedido";
import { computed, defineComponent, reactive, toRefs } from "vue";

export default defineComponent({
  name: "Cabecalho",
  setup() {
    const $pedidoStore = usePedidoStore();

    const data = reactive({
      evento: computed(() => $pedidoStore.$state.evento),
    });

    function formatDate(date: string, format?: "DD/MM/YYYY" | "HH:mm") {
      return ApiDate.format(date, format ?? "DD/MM/YYYY HH:mm");
    }

    return {
      ...toRefs(data),
      formatDate,
    };
  },
});
</script>
<style scoped>
.hero-container {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
