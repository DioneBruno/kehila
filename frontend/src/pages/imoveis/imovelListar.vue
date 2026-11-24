<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Imóveis</p>
        <p class="text-caption text-grey-6 q-ma-none">Imóveis administrados</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Novo imóvel"
          :to="{ name: 'imoveis.imoveis.criar' }"
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
            placeholder="Buscar por identificação ou endereço..."
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
            v-model="situacao"
            unelevated
            no-caps
            toggle-color="primary"
            color="grey-3"
            text-color="grey-8"
            :options="opcoesSituacao"
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
      no-data-label="Nenhum imóvel encontrado"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
      class="cursor-pointer"
      @request="aoPaginar"
      @row-click="(_evt, row) => abrir(row.uuid)"
    >
      <template v-slot:body-cell-situacao="props">
        <q-td :props="props">
          <q-badge
            :color="corSituacao(props.row.situacao)"
            :label="labelSituacao(props.row.situacao)"
          />
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
                <div class="table-card__title">{{ props.row.identificacao }}</div>
                <div class="text-caption text-muted q-mt-xs">{{ props.row.proprietarioNome }}</div>
                <div class="text-caption text-muted ellipsis q-mt-xs">
                  {{ enderecoEmLinha(props.row) }}
                </div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-badge
                    :color="corSituacao(props.row.situacao)"
                    :label="labelSituacao(props.row.situacao)"
                  />
                  <q-badge color="grey-7" :label="labelImovelTipo(props.row.tipo)" />
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
import type { Imovel, ImovelSituacao } from "src/@modules/imoveis/imovel.http";
import {
  IMOVEL_SITUACOES,
  ImoveisService,
  corSituacao,
  enderecoEmLinha,
  labelImovelTipo,
  labelSituacao,
} from "./imoveis.service";

const COLUNAS = [
  { name: "identificacao", label: "Imóvel", field: "identificacao", align: "left" as const },
  {
    name: "proprietario",
    label: "Proprietário",
    field: "proprietarioNome",
    align: "left" as const,
  },
  {
    name: "tipo",
    label: "Tipo",
    field: (row: Imovel) => labelImovelTipo(row.tipo),
    align: "left" as const,
  },
  {
    name: "endereco",
    label: "Endereço",
    field: (row: Imovel) => enderecoEmLinha(row),
    align: "left" as const,
  },
  { name: "situacao", label: "Situação", field: "situacao", align: "left" as const },
];

const OPCOES_SITUACAO = [
  { label: "Todos", value: "" },
  ...IMOVEL_SITUACOES.map((s) => ({ label: s.label, value: s.value })),
];

export default defineComponent({
  name: "ImovelListar",
  setup() {
    const $q = useQuasar();
    const $router = useRouter();
    const $service = new ImoveisService();
    const modoCartoes = computed(() => $q.screen.lt.md);

    const data = reactive({
      carregando: false,
      itens: [] as Imovel[],
      busca: "",
      situacao: "" as "" | ImovelSituacao,
      paginacao: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
    });

    async function carregar() {
      data.carregando = true;
      const resultado = await $service.listarImoveis({
        busca: data.busca?.trim() || undefined,
        situacao: data.situacao || undefined,
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
      void $router.push({ name: "imoveis.imoveis.detalhe", params: { uuid } });
    }

    watch([() => data.busca, () => data.situacao], () => {
      data.paginacao.page = 1;
      void carregar();
    });
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      colunas: COLUNAS,
      opcoesSituacao: OPCOES_SITUACAO,
      modoCartoes,
      aoPaginar,
      abrir,
      corSituacao,
      labelSituacao,
      labelImovelTipo,
      enderecoEmLinha,
    };
  },
});
</script>
