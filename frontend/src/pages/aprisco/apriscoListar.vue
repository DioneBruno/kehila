<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Apriscos</p>
        <p class="text-caption text-grey-6 q-ma-none">Gerencie os apriscos da igreja</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Novo Aprisco"
          :to="{ name: 'apriscos.criar' }"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input
            v-model="filtros.busca"
            dense
            outlined
            placeholder="Buscar por nome, horário ou endereço..."
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-auto">
          <q-btn-toggle
            v-model="filtros.status"
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

    <!-- Tabela -->
    <q-table
      flat
      bordered
      :rows="apriscosFiltrados"
      :columns="colunas"
      row-key="uuid"
      :loading="carregando"
      :rows-per-page-options="[10, 20, 50, 0]"
      :pagination="{ rowsPerPage: 20, sortBy: 'nome' }"
      no-data-label="Nenhum aprisco encontrado"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
      class="cursor-pointer"
      @row-click="(_evt, row) => abrir(row.uuid)"
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="statusAprisco(props.row.status).color"
            :label="statusAprisco(props.row.status).label"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-acoes="props">
        <q-td :props="props">
          <q-btn
            v-if="linkMapa(props.row)"
            flat
            dense
            round
            icon="map"
            color="primary"
            :href="linkMapa(props.row)!"
            target="_blank"
            @click.stop
          >
            <q-tooltip>Ver no mapa</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="visibility"
            color="primary"
            :to="{ name: 'apriscos.detalhe', params: { uuid: props.row.uuid } }"
            @click.stop
          >
            <q-tooltip>Ver aprisco</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import type { Aprisco } from "src/@modules/aprisco/aprisco.http";
import { ApriscoService, descricaoEncontro, linkMapa, statusAprisco } from "./aprisco.service";
import { useQuasar } from "quasar";

const COLUNAS = [
  { name: "nome", label: "Nome", field: "nome", align: "left" as const, sortable: true },
  {
    name: "encontro",
    label: "Encontro",
    field: (a: Aprisco) => descricaoEncontro(a) ?? "",
    align: "left" as const,
  },
  {
    name: "endereco",
    label: "Endereço",
    field: "endereco",
    align: "left" as const,
    sortable: true,
  },
  { name: "status", label: "Status", field: "status", align: "left" as const, sortable: true },
  { name: "acoes", label: "", field: "uuid", align: "right" as const },
];

const OPCOES_STATUS = [
  { label: "Todos", value: "todos" },
  { label: "Ativos", value: "ativo" },
  { label: "Inativos", value: "inativo" },
];

export default defineComponent({
  name: "ApriscoListar",
  setup() {
    const $q = useQuasar();
    const $service = new ApriscoService();
    const $router = useRouter();

    const data = reactive({
      carregando: false,
      colunas: COLUNAS,
      opcoesStatus: OPCOES_STATUS,
      apriscos: [] as Aprisco[],
      filtros: {
        busca: "",
        status: "todos",
      },
    });

    const apriscosFiltrados = computed(() => {
      const termo = (data.filtros.busca ?? "").trim().toLowerCase();

      return data.apriscos.filter((a) => {
        if (data.filtros.status !== "todos" && a.status !== data.filtros.status) return false;
        if (!termo) return true;

        return (
          a.nome.toLowerCase().includes(termo) ||
          (descricaoEncontro(a) ?? "").toLowerCase().includes(termo) ||
          (a.endereco ?? "").toLowerCase().includes(termo)
        );
      });
    });

    async function carregar() {
      data.carregando = true;
      const apriscos = await $service.listar();
      if (apriscos) data.apriscos = apriscos;
      data.carregando = false;
    }

    function abrir(uuid: string) {
      void $router.push({ name: "apriscos.detalhe", params: { uuid } });
    }

    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      apriscosFiltrados,
      abrir,
      linkMapa,
      statusAprisco,
    };
  },
});
</script>
