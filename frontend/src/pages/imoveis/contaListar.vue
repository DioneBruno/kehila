<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Contas</p>
        <p class="text-caption text-grey-6 q-ma-none">Encargos, despesas e guias de imposto</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nova conta"
          :to="{ name: 'imoveis.contas.criar' }"
        />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtro.tipo"
            label="Tipo"
            dense
            outlined
            clearable
            emit-value
            map-options
            :options="tipos"
            @update:model-value="filtro.categoria = null"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtro.categoria"
            label="Categoria"
            dense
            outlined
            clearable
            emit-value
            map-options
            :options="categorias"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtro.situacao"
            label="Situação"
            dense
            outlined
            clearable
            emit-value
            map-options
            :options="situacoes"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtro.proprietarioUuid"
            label="Proprietário"
            dense
            outlined
            clearable
            use-input
            input-debounce="300"
            emit-value
            map-options
            :options="proprietarios.opcoes.value"
            @filter="proprietarios.filtrar"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtro.imovelUuid"
            label="Imóvel"
            dense
            outlined
            clearable
            use-input
            input-debounce="300"
            emit-value
            map-options
            :options="imoveis.opcoes.value"
            @filter="imoveis.filtrar"
          />
        </div>
        <div class="col-6 col-md-3">
          <q-input
            v-model="filtro.vencimentoDe"
            label="Vencimento de"
            type="date"
            dense
            outlined
            stack-label
            clearable
          />
        </div>
        <div class="col-6 col-md-3">
          <q-input
            v-model="filtro.vencimentoAte"
            label="Vencimento até"
            type="date"
            dense
            outlined
            stack-label
            clearable
          />
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-4">
        <q-card flat bordered>
          <q-card-section class="q-py-sm">
            <div class="text-caption text-grey-6">Contas no filtro</div>
            <div class="text-subtitle1 text-weight-bold">{{ paginacao.rowsNumber }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4">
        <q-card flat bordered>
          <q-card-section class="q-py-sm">
            <div class="text-caption text-grey-6">Valor total</div>
            <div class="text-subtitle1 text-weight-bold">{{ formatarMoeda(totalValor) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4">
        <q-card flat bordered>
          <q-card-section class="q-py-sm">
            <div class="text-caption text-grey-6">Total pago</div>
            <div class="text-subtitle1 text-weight-bold">{{ formatarMoeda(totalPago) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

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
      no-data-label="Nenhuma conta encontrada"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
      class="cursor-pointer"
      @request="aoPaginar"
      @row-click="(_evt, row) => abrir(row.uuid)"
    >
      <template v-slot:body-cell-situacao="props">
        <q-td :props="props">
          <q-badge
            :color="corContaSituacao(props.row.situacao)"
            :label="labelContaSituacao(props.row.situacao)"
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
                <div class="table-card__title">{{ labelConta(props.row) }}</div>
                <div class="text-caption text-muted q-mt-xs">
                  {{ props.row.imovelIdentificacao || props.row.proprietarioNome }}
                </div>
                <div class="text-caption text-muted q-mt-xs">
                  {{ formatarMoeda(props.row.valor) }} · vence
                  {{ formatarData(props.row.vencimento) }}
                </div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-badge
                    :color="corContaSituacao(props.row.situacao)"
                    :label="labelContaSituacao(props.row.situacao)"
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
import { useRoute, useRouter } from "vue-router";
import type { Conta, ContaSituacao, ContaTipo } from "src/@modules/imoveis/conta.http";
import { criarBusca } from "./contratoForm.vue";
import {
  CATEGORIAS_POR_TIPO,
  CONTA_SITUACOES,
  CONTA_TIPOS,
  ImoveisService,
  corContaSituacao,
  formatarData,
  formatarMoeda,
  labelContaSituacao,
  labelContaTipo,
  labelConta,
} from "./imoveis.service";

const COLUNAS = [
  {
    name: "vencimento",
    label: "Vencimento",
    field: (row: Conta) => formatarData(row.vencimento),
    align: "left" as const,
  },
  { name: "conta", label: "Conta", field: (row: Conta) => labelConta(row), align: "left" as const },
  {
    name: "tipo",
    label: "Tipo",
    field: (row: Conta) => labelContaTipo(row.tipo),
    align: "left" as const,
  },
  {
    name: "proprietario",
    label: "Proprietário",
    field: "proprietarioNome",
    align: "left" as const,
  },
  {
    name: "imovel",
    label: "Imóvel",
    field: (row: Conta) => row.imovelIdentificacao ?? "-",
    align: "left" as const,
  },
  {
    name: "valor",
    label: "Valor",
    field: (row: Conta) => formatarMoeda(row.valor),
    align: "right" as const,
  },
  { name: "situacao", label: "Situação", field: "situacao", align: "left" as const },
];

const texto = (v: unknown) => (typeof v === "string" && v ? v : null);

export default defineComponent({
  name: "ContaListar",
  setup() {
    const $q = useQuasar();
    const $route = useRoute();
    const $router = useRouter();
    const $service = new ImoveisService();
    const modoCartoes = computed(() => $q.screen.lt.md);

    // A agenda e as telas de imóvel/contrato linkam aqui com os filtros na query string.
    const q = $route.query;
    const filtro = reactive({
      tipo: texto(q.tipo) as ContaTipo | null,
      categoria: texto(q.categoria),
      situacao: texto(q.situacao) as ContaSituacao | null,
      proprietarioUuid: texto(q.proprietarioUuid),
      imovelUuid: texto(q.imovelUuid),
      contratoUuid: texto(q.contratoUuid),
      vencimentoDe: texto(q.vencimentoDe),
      vencimentoAte: texto(q.vencimentoAte),
    });

    const data = reactive({
      carregando: false,
      itens: [] as Conta[],
      totalValor: 0,
      totalPago: 0,
      paginacao: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
    });

    // Rótulo do que veio pela URL (só existe o uuid) até o usuário buscar de novo.
    const proprietarioAtual = reactive({ nome: "" });
    const imovelAtual = reactive({ nome: "" });
    const proprietarios = criarBusca(
      async (busca) => {
        const r = await $service.listarPessoas({
          papel: "proprietario",
          busca: busca || undefined,
          porPagina: 30,
        });
        return (r?.itens ?? []).map((p) => ({ value: p.uuid, label: p.nome }));
      },
      () =>
        filtro.proprietarioUuid
          ? { value: filtro.proprietarioUuid, label: proprietarioAtual.nome }
          : null,
    );
    const imoveis = criarBusca(
      async (busca) => {
        const r = await $service.listarImoveis({ busca: busca || undefined, porPagina: 30 });
        return (r?.itens ?? []).map((i) => ({ value: i.uuid, label: i.identificacao }));
      },
      () => (filtro.imovelUuid ? { value: filtro.imovelUuid, label: imovelAtual.nome } : null),
    );

    const categorias = computed(() => {
      const lista = filtro.tipo
        ? CATEGORIAS_POR_TIPO[filtro.tipo]
        : Object.values(CATEGORIAS_POR_TIPO).flat();
      return lista.filter((o, i) => lista.findIndex((x) => x.value === o.value) === i);
    });

    async function carregar() {
      data.carregando = true;
      const resultado = await $service.listarContas({
        tipo: filtro.tipo || undefined,
        categoria: filtro.categoria || undefined,
        situacao: filtro.situacao || undefined,
        proprietarioUuid: filtro.proprietarioUuid || undefined,
        imovelUuid: filtro.imovelUuid || undefined,
        contratoUuid: filtro.contratoUuid || undefined,
        vencimentoDe: filtro.vencimentoDe || undefined,
        vencimentoAte: filtro.vencimentoAte || undefined,
        pagina: data.paginacao.page,
        porPagina: data.paginacao.rowsPerPage,
      });
      if (resultado) {
        data.itens = resultado.itens;
        data.totalValor = resultado.totalValor;
        data.totalPago = resultado.totalPago;
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
      void $router.push({ name: "imoveis.contas.detalhe", params: { uuid } });
    }

    watch(filtro, () => {
      data.paginacao.page = 1;
      void carregar();
    });

    onMounted(() => {
      void carregar();
      if (filtro.proprietarioUuid) {
        void $service.buscarPessoa(filtro.proprietarioUuid).then((p) => {
          proprietarioAtual.nome = p?.nome ?? "";
          proprietarios.garantirAtual();
        });
      }
      if (filtro.imovelUuid) {
        void $service.buscarImovel(filtro.imovelUuid).then((i) => {
          imovelAtual.nome = i?.identificacao ?? "";
          imoveis.garantirAtual();
        });
      }
    });

    return {
      ...toRefs(data),
      filtro,
      colunas: COLUNAS,
      tipos: CONTA_TIPOS,
      situacoes: CONTA_SITUACOES.map((s) => ({ label: s.label, value: s.value })),
      categorias,
      proprietarios,
      imoveis,
      modoCartoes,
      aoPaginar,
      abrir,
      corContaSituacao,
      labelContaSituacao,
      labelConta,
      formatarData,
      formatarMoeda,
    };
  },
});
</script>
