<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <p class="text-subtitle1 text-weight-bold q-ma-none col">Contas</p>
        <q-btn
          unelevated
          dense
          no-caps
          color="primary"
          icon="add"
          label="Nova conta"
          :to="{ name: 'imoveis.contas.criar', query: queryNova }"
        />
      </div>
      <p v-if="!contas.length" class="text-grey-6 q-ma-none">Nenhuma conta lançada.</p>
      <q-list v-else separator dense>
        <q-item
          v-for="c in contas"
          :key="c.uuid"
          clickable
          v-ripple
          :to="{ name: 'imoveis.contas.detalhe', params: { uuid: c.uuid } }"
        >
          <q-item-section>
            <q-item-label>{{ labelConta(c) }}</q-item-label>
            <q-item-label caption>
              vence {{ formatarData(c.vencimento) }} · {{ formatarMoeda(c.valor) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              :color="corContaSituacao(c.situacao)"
              :label="labelContaSituacao(c.situacao)"
            />
          </q-item-section>
        </q-item>
      </q-list>
      <q-btn
        v-if="total > contas.length"
        flat
        dense
        no-caps
        color="primary"
        class="q-mt-sm"
        :label="`Ver todas (${total})`"
        :to="{ name: 'imoveis.contas', query: queryTodas }"
      />
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import type { Conta } from "src/@modules/imoveis/conta.http";
import {
  ImoveisService,
  corContaSituacao,
  formatarData,
  formatarMoeda,
  labelConta,
  labelContaSituacao,
} from "src/pages/imoveis/imoveis.service";

const LIMITE = 20;

export default defineComponent({
  name: "ContasDoVinculo",
  props: {
    imovelUuid: { type: String, default: undefined },
    contratoUuid: { type: String, default: undefined },
    /** No detalhe do contrato: imóvel do contrato, para "Nova conta" levar os dois. */
    imovelUuidDoContrato: { type: String, default: undefined },
  },
  setup(props) {
    const $service = new ImoveisService();
    const contas = ref<Conta[]>([]);
    const total = ref(0);

    const queryNova = computed(() => {
      const imovelUuid = props.imovelUuid ?? props.imovelUuidDoContrato;
      const query: Record<string, string> = {};
      if (imovelUuid) query.imovelUuid = imovelUuid;
      if (props.contratoUuid) query.contratoUuid = props.contratoUuid;
      return query;
    });
    const queryTodas = computed(() => {
      const query: Record<string, string> = {};
      if (props.contratoUuid) query.contratoUuid = props.contratoUuid;
      else if (props.imovelUuid) query.imovelUuid = props.imovelUuid;
      return query;
    });

    async function carregar() {
      if (!props.imovelUuid && !props.contratoUuid) return;
      const r = await $service.listarContas({
        imovelUuid: props.contratoUuid ? undefined : props.imovelUuid,
        contratoUuid: props.contratoUuid,
        pagina: 1,
        porPagina: LIMITE,
      });
      if (r) {
        contas.value = r.itens;
        total.value = r.total;
      }
    }

    watch(
      () => [props.imovelUuid, props.contratoUuid],
      () => void carregar(),
    );
    onMounted(() => void carregar());

    return {
      contas,
      total,
      queryNova,
      queryTodas,
      corContaSituacao,
      labelContaSituacao,
      labelConta,
      formatarData,
      formatarMoeda,
    };
  },
});
</script>
