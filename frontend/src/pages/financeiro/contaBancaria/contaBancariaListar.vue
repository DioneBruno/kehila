<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Contas Bancárias</p>
        <p class="text-caption text-grey-6 q-ma-none">Gerencie suas contas bancárias</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nova Conta"
          :to="{ name: 'financeiro.contas-bancarias.criar' }"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="filter-bar">
        <q-input
          v-model="filtros.busca"
          dense
          outlined
          placeholder="Buscar por nome..."
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
      :grid="modoCartoes"
      card-container-class="q-pt-xs table-cards"
      :rows="contas"
      :columns="colunas"
      row-key="uuid"
      :loading="carregando"
      :rows-per-page-options="[10, 20, 50]"
      v-model:pagination="paginacao"
      @request="onRequest"
      no-data-label="Nenhuma conta bancária encontrada"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="statusCor(props.value)" :label="statusLabel(props.value)" />
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
            :to="{ name: 'financeiro.contas-bancarias.detalhe', params: { uuid: props.row.uuid } }"
          >
            <q-tooltip>Ver conta</q-tooltip>
          </q-btn>
        </q-td>
      </template>
      <!-- Celular: cartões no lugar das linhas -->
      <template v-slot:item="props">
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-card flat bordered v-ripple class="table-card cursor-pointer" @click="abrirDetalhe(props.row.uuid)">
            <q-card-section class="row no-wrap items-start q-gutter-x-sm">
              <div class="col" style="min-width: 0">
                <div class="table-card__title">{{ props.row.nome }}</div>
                <div class="text-caption text-muted row no-wrap items-center q-mt-xs">
                  <q-icon name="account_balance" size="14px" class="q-mr-xs" /><span class="ellipsis">Banco {{ props.row.bancoNumero }} · Ag. {{ props.row.agencia }} · Conta {{ props.row.conta }}</span>
                </div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-badge :color="statusCor(props.row.status)" :label="statusLabel(props.row.status)" />
                </div>
              </div>
              <div class="col-auto row no-wrap items-center">
                <q-icon name="chevron_right" size="sm" color="grey-5" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { ContaBancariaService, STATUS_CORES, STATUS_LABELS } from "./contaBancaria.service";

const COLUNAS = [
  { name: "nome", label: "Nome", field: "nome", align: "left" as const, sortable: true },
  { name: "bancoNumero", label: "Banco", field: "bancoNumero", align: "left" as const },
  { name: "agencia", label: "Agência", field: "agencia", align: "left" as const },
  { name: "conta", label: "Conta", field: "conta", align: "left" as const },
  { name: "status", label: "Status", field: "status", align: "left" as const },
  { name: "acoes", label: "", field: "acoes", align: "right" as const },
] as const;

const OPCOES_STATUS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default defineComponent({
  name: "FinanceiroContasBancariasListar",
  setup() {
    const $q = useQuasar();
    const $router = useRouter();
    // Celular e tablet: lista em cartões; desktop: tabela.
    const modoCartoes = computed(() => $q.screen.lt.md);
    const abrirDetalhe = (uuid: string) =>
      void $router.push({ name: "financeiro.contas-bancarias.detalhe", params: { uuid } });
    const $service = new ContaBancariaService();

    const data = reactive({
      carregando: false,
      colunas: COLUNAS,
      opcoesStatus: OPCOES_STATUS,
      contas: [] as any[],
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
        data.contas = resposta.data;
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

    onMounted(() => void carregar());

    return {
      modoCartoes,
      abrirDetalhe,
      ...toRefs(data),
      onRequest,
      buscar,
      statusLabel,
      statusCor,
    };
  },
});
</script>
