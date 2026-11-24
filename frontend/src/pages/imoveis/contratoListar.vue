<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Contratos</p>
        <p class="text-caption text-grey-6 q-ma-none">Contratos de locação</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Novo contrato"
          :to="{ name: 'imoveis.contratos.criar' }"
        />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="filter-bar">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input
            v-model="busca"
            dense
            outlined
            placeholder="Buscar por número, imóvel ou inquilino..."
            clearable
            debounce="400"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-auto">
          <q-btn-toggle
            v-model="status"
            unelevated
            no-caps
            toggle-color="primary"
            color="grey-3"
            text-color="grey-8"
            :options="opcoesStatus"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-table
      v-model:pagination="paginacao"
      flat
      bordered
      :grid="modoCartoes"
      card-container-class="q-pt-xs table-cards"
      :rows="itens"
      :columns="colunas"
      row-key="uuid"
      :loading="carregando"
      :rows-per-page-options="[10, 20, 50]"
      no-data-label="Nenhum contrato encontrado"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
      class="cursor-pointer"
      @request="aoPaginar"
      @row-click="(_evt, row) => abrir(row.uuid)"
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="corStatus(props.row.status)" :label="labelStatus(props.row.status)" />
        </q-td>
      </template>

      <template v-slot:item="props">
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-card
            flat
            bordered
            v-ripple
            class="table-card cursor-pointer"
            @click="abrir(props.row.uuid)"
          >
            <q-card-section class="row no-wrap items-start q-gutter-x-sm">
              <div class="col" style="min-width: 0">
                <div class="table-card__title">{{ props.row.imovelIdentificacao }}</div>
                <div class="text-caption text-muted q-mt-xs">{{ props.row.inquilinoNome }}</div>
                <div class="text-caption text-muted q-mt-xs">
                  {{ formatarMoeda(props.row.valorAluguel) }} · até
                  {{ formatarData(props.row.fim) }}
                </div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-badge
                    :color="corStatus(props.row.status)"
                    :label="labelStatus(props.row.status)"
                  />
                </div>
              </div>
              <q-icon name="chevron_right" size="sm" color="grey-5" />
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { useQuasar } from "quasar";
import { computed, defineComponent, onMounted, reactive, toRefs, watch } from "vue";
import { useRouter } from "vue-router";
import type { Contrato, ContratoStatus } from "src/@modules/imoveis/contrato.http";
import {
  CONTRATO_STATUS,
  ImoveisService,
  corStatus,
  formatarData,
  formatarMoeda,
  labelStatus,
} from "./imoveis.service";

const COLUNAS = [
  { name: "imovel", label: "Imóvel", field: "imovelIdentificacao", align: "left" as const },
  { name: "inquilino", label: "Inquilino", field: "inquilinoNome", align: "left" as const },
  {
    name: "valor",
    label: "Aluguel",
    field: (row: Contrato) => formatarMoeda(row.valorAluguel),
    align: "right" as const,
  },
  {
    name: "fim",
    label: "Fim",
    field: (row: Contrato) => formatarData(row.fim),
    align: "left" as const,
  },
  { name: "status", label: "Situação", field: "status", align: "left" as const },
];

const OPCOES_STATUS = [
  { label: "Todos", value: "" },
  ...CONTRATO_STATUS.map((s) => ({ label: s.label, value: s.value })),
];

export default defineComponent({
  name: "ContratoListar",
  setup() {
    const $q = useQuasar();
    const $router = useRouter();
    const $service = new ImoveisService();
    const modoCartoes = computed(() => $q.screen.lt.md);

    const data = reactive({
      carregando: false,
      itens: [] as Contrato[],
      busca: "",
      status: "vigente" as "" | ContratoStatus,
      paginacao: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
    });

    async function carregar() {
      data.carregando = true;
      const resultado = await $service.listarContratos({
        busca: data.busca?.trim() || undefined,
        status: data.status || undefined,
        pagina: data.paginacao.page,
        porPagina: data.paginacao.rowsPerPage,
      });
      if (resultado) {
        data.itens = resultado.itens;
        data.paginacao.rowsNumber = resultado.total;
      }
      data.carregando = false;
    }

    function aoPaginar(props: { pagination: { page: number; rowsPerPage: number } }) {
      data.paginacao.page = props.pagination.page;
      data.paginacao.rowsPerPage = props.pagination.rowsPerPage;
      void carregar();
    }

    function abrir(uuid: string) {
      void $router.push({ name: "imoveis.contratos.detalhe", params: { uuid } });
    }

    watch([() => data.busca, () => data.status], () => {
      data.paginacao.page = 1;
      void carregar();
    });
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      colunas: COLUNAS,
      opcoesStatus: OPCOES_STATUS,
      modoCartoes,
      aoPaginar,
      abrir,
      corStatus,
      labelStatus,
      formatarData,
      formatarMoeda,
    };
  },
});
</script>
