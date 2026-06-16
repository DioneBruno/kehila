<template>
  <div>
    <div v-if="evento.lotes.length === 0" class="text-center q-py-xl">
      <q-icon name="confirmation_number" size="56px" color="grey-4" />
      <div class="text-subtitle1 text-grey-5 q-mt-md">Nenhum tipo de Inscrição disponível</div>
    </div>

    <div v-else class="q-gutter-md">
      <div class="ql-editor" style="padding: 0" v-html="evento.descricao" />
      <div v-for="lote in evento.lotes" :key="lote.uuid">
        <!-- <div class="text-grey-8">Opções para ingressos</div> -->
        <div class="row items-center q-mb-sm">
          <q-separator class="col q-ml-sm" />
          <span class="text-overline text-grey-7 text-bold">{{ lote.nome }}</span>
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
                <div class="text-caption text-grey-7">
                  {{ tipo.gerarQuantidadeIngressos }} ingressos
                </div>
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
                    @click="diminuir(tipo)"
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
                    @click="aumentar(tipo)"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-stepper-navigation class="row">
      <q-space />
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
import { usePedidoStore } from "src/stores/pedido";
import { computed, defineComponent, reactive, toRefs } from "vue";
import "quill/dist/quill.snow.css";

export default defineComponent({
  name: "StepIngressos",
  emits: ["next"],
  setup() {
    const $pedidoStore = usePedidoStore();

    const data = reactive({
      evento: computed(() => $pedidoStore.$state.evento),
      quantidades: computed(() =>
        Object.fromEntries(
          $pedidoStore.$state.pedido.itens.map(
            (item: { tipoIngressoUuid: string; quantidade: number }) => [
              item.tipoIngressoUuid,
              item.quantidade,
            ],
          ),
        ),
      ),
      totalIngressos: computed(() =>
        $pedidoStore.$state.pedido.itens.reduce(
          (acc: number, item: { quantidade: number }) => acc + item.quantidade,
          0,
        ),
      ),
    });

    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function aumentar(tipoIngresso: { uuid: string; nome: string }) {
      const jaExiste = $pedidoStore.$state.pedido.itens.some(
        (item: { tipoIngressoUuid: string }) => item.tipoIngressoUuid === tipoIngresso.uuid,
      );
      if (jaExiste) {
        $pedidoStore.incrementarTipoIngresso(tipoIngresso.uuid);
      } else {
        $pedidoStore.adicionarTipoIngresso(tipoIngresso.uuid, tipoIngresso.nome);
      }
    }

    function diminuir(tipoIngresso: { uuid: string }) {
      $pedidoStore.decrementarTipoIngresso(tipoIngresso.uuid);
    }

    return {
      ...toRefs(data),
      formatarMoeda,
      aumentar,
      diminuir,
    };
  },
});
</script>
