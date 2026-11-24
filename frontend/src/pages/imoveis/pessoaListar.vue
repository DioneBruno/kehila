<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">{{ titulo }}</p>
        <p class="text-caption text-grey-6 q-ma-none">{{ subtitulo }}</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          :label="`Novo ${singular}`"
          :to="{ name: 'imoveis.pessoas.criar', query: { papel } }"
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
            placeholder="Buscar por nome ou CPF/CNPJ..."
            clearable
            debounce="400"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
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
      no-data-label="Nenhum registro encontrado"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
      class="cursor-pointer"
      @request="aoPaginar"
      @row-click="(_evt, row) => abrir(row.uuid)"
    >
      <template v-slot:body-cell-papeis="props">
        <q-td :props="props">
          <q-badge
            v-if="props.row.ehProprietario"
            color="primary"
            label="Proprietário"
            class="q-mr-xs"
          />
          <q-badge v-if="props.row.ehInquilino" color="blue-6" label="Inquilino" class="q-mr-xs" />
          <q-badge v-if="props.row.ehFiador" color="orange-8" label="Fiador" />
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
                <div class="table-card__title">{{ props.row.nome }}</div>
                <div class="text-caption text-muted q-mt-xs">
                  {{ formatarDocumento(props.row.documento) }}
                </div>
                <div v-if="props.row.telefone" class="text-caption text-muted q-mt-xs">
                  {{ formatarTelefone(props.row.telefone) }}
                </div>
                <div v-if="props.row.email" class="text-caption text-muted ellipsis q-mt-xs">
                  {{ props.row.email }}
                </div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-badge v-if="props.row.ehProprietario" color="primary" label="Proprietário" />
                  <q-badge v-if="props.row.ehInquilino" color="blue-6" label="Inquilino" />
                  <q-badge v-if="props.row.ehFiador" color="orange-8" label="Fiador" />
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
import type { Pessoa, PessoaPapel } from "src/@modules/imoveis/pessoa.http";
import {
  ImoveisService,
  formatarDocumento,
  formatarTelefone,
  labelPessoaTipo,
} from "./imoveis.service";

const COLUNAS = [
  { name: "nome", label: "Nome", field: "nome", align: "left" as const },
  {
    name: "tipo",
    label: "Tipo",
    field: (row: Pessoa) => labelPessoaTipo(row.tipo),
    align: "left" as const,
  },
  {
    name: "documento",
    label: "CPF/CNPJ",
    field: "documento",
    align: "left" as const,
    format: formatarDocumento,
  },
  {
    name: "telefone",
    label: "Telefone",
    field: "telefone",
    align: "left" as const,
    format: formatarTelefone,
  },
  { name: "email", label: "E-mail", field: "email", align: "left" as const },
  { name: "papeis", label: "Papéis", field: "uuid", align: "left" as const },
];

export default defineComponent({
  name: "PessoaListar",
  setup() {
    const $q = useQuasar();
    const $route = useRoute();
    const $router = useRouter();
    const $service = new ImoveisService();
    const modoCartoes = computed(() => $q.screen.lt.md);

    // A mesma tela serve proprietários e inquilinos; o papel vem do meta da rota.
    const papel = computed(() => ($route.meta.papel as PessoaPapel | undefined) ?? "proprietario");
    const singular = computed(() => (papel.value === "inquilino" ? "inquilino" : "proprietário"));
    const titulo = computed(() => (papel.value === "inquilino" ? "Inquilinos" : "Proprietários"));
    const subtitulo = computed(() =>
      papel.value === "inquilino"
        ? "Pessoas que alugam seus imóveis"
        : "Donos dos imóveis administrados",
    );

    const data = reactive({
      carregando: false,
      itens: [] as Pessoa[],
      busca: "",
      paginacao: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
    });

    async function carregar() {
      data.carregando = true;
      const resultado = await $service.listarPessoas({
        papel: papel.value,
        busca: data.busca?.trim() || undefined,
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
      void $router.push({ name: "imoveis.pessoas.detalhe", params: { uuid } });
    }

    watch(
      () => data.busca,
      () => {
        data.paginacao.page = 1;
        void carregar();
      },
    );
    // Troca entre proprietários e inquilinos reaproveita o componente.
    watch(papel, () => {
      const limpou = !!data.busca;
      data.busca = ""; // o watch da busca recarrega
      data.paginacao.page = 1;
      if (!limpou) void carregar();
    });
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      colunas: COLUNAS,
      modoCartoes,
      papel,
      singular,
      titulo,
      subtitulo,
      aoPaginar,
      abrir,
      formatarDocumento,
      formatarTelefone,
    };
  },
});
</script>
