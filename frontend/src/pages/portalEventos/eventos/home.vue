<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Eventos</p>
        <p class="text-caption text-grey-6 q-ma-none">Gerencie seus eventos</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Novo Evento"
          :to="{ name: 'eventos.criar' }"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-gutter-md items-center">
        <q-input
          v-model="filtros.busca"
          dense
          outlined
          placeholder="Buscar por título..."
          clearable
          class="col-12 col-sm-4"
          @update:model-value="buscar"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select
          v-model="filtros.status"
          dense
          outlined
          clearable
          emit-value
          map-options
          label="Status"
          :options="opcoesStatus"
          class="col-12 col-sm-3"
          @update:model-value="buscar"
        />
      </q-card-section>
    </q-card>

    <!-- Tabela -->
    <q-table
      flat
      bordered
      :rows="eventos"
      :columns="colunas"
      row-key="uuid"
      :loading="carregando"
      :rows-per-page-options="[10, 20, 50]"
      v-model:pagination="paginacao"
      @request="onRequest"
      no-data-label="Nenhum evento encontrado"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="statusCor(props.value)" :label="statusLabel(props.value)" />
        </q-td>
      </template>

      <template v-slot:body-cell-dataInicio="props">
        <q-td :props="props">
          {{ formatarData(props.value) }}
        </q-td>
      </template>

      <template v-slot:body-cell-online="props">
        <q-td :props="props" class="text-center">
          <q-icon
            :name="props.value ? 'videocam' : 'location_on'"
            :color="props.value ? 'primary' : 'grey-6'"
            size="sm"
          >
            <q-tooltip>{{ props.value ? "Online" : "Presencial" }}</q-tooltip>
          </q-icon>
        </q-td>
      </template>

      <template v-slot:body-cell-acoes="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="visibility"
            color="primary"
            :to="{ name: 'eventos.detalhe', params: { uuid: props.row.uuid } }"
          >
            <q-tooltip>Ver evento</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { EventosService, STATUS_CORES, STATUS_LABELS } from "./eventos.service";

const COLUNAS = [
  {
    name: "titulo",
    label: "Título",
    field: "titulo",
    align: "left",
    sortable: true,
    readonly: true,
  },
  {
    name: "dataInicio",
    label: "Data",
    field: "dataInicio",
    align: "left",
    sortable: true,
    readonly: true,
  },
  { name: "localNome", label: "Local", field: "localNome", align: "left", readonly: true },
  { name: "online", label: "Tipo", field: "online", align: "center", readonly: true },
  { name: "status", label: "Status", field: "status", align: "left", readonly: true },
  { name: "acoes", label: "", field: "acoes", align: "right", readonly: true },
] as const;

const OPCOES_STATUS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default defineComponent({
  name: "PortalEventosEventosHome",
  setup() {
    const $service = new EventosService();

    const data = reactive({
      carregando: false,
      colunas: COLUNAS,
      opcoesStatus: OPCOES_STATUS,
      eventos: [] as any[],
      filtros: {
        busca: "",
        status: null as string | null,
      },
      paginacao: {
        page: 1,
        rowsPerPage: 20,
        rowsNumber: 0,
      },
    });

    async function carregar(pagina = 1, porPagina = 20) {
      data.carregando = true;
      const resposta = await $service.listar({
        busca: data.filtros.busca || undefined,
        status: data.filtros.status || undefined,
        pagina,
        porPagina,
      });
      if (resposta) {
        data.eventos = resposta.data;
        data.paginacao.rowsNumber = resposta.meta.total;
        data.paginacao.page = pagina;
        data.paginacao.rowsPerPage = porPagina;
      }
      data.carregando = false;
    }

    function onRequest(props: any) {
      const { page, rowsPerPage } = props.pagination;
      void carregar(page, rowsPerPage);
    }

    function buscar() {
      void carregar(1, data.paginacao.rowsPerPage);
    }

    function statusLabel(status: string) {
      return STATUS_LABELS[status] ?? status;
    }

    function statusCor(status: string) {
      return STATUS_CORES[status] ?? "grey";
    }

    function formatarData(iso: string) {
      if (!iso) return "-";
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      onRequest,
      buscar,
      statusLabel,
      statusCor,
      formatarData,
    };
  },
});
</script>
