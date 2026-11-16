<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Membros</p>
        <p class="text-caption text-grey-6 q-ma-none">Gerencie os membros da igreja</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Novo Membro"
          :to="{ name: 'membros.criar' }"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="filter-bar">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input
            v-model="filtros.busca"
            dense
            outlined
            placeholder="Buscar por nome, e-mail, CPF ou telefone..."
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-auto">
          <q-btn-toggle
            v-model="filtros.situacao"
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

    <!-- Tabela -->
    <q-table
      flat
      bordered
      :grid="modoCartoes"
      card-container-class="q-pt-xs table-cards"
      :rows="membrosFiltrados"
      :columns="colunas"
      row-key="uuid"
      :loading="carregando"
      :rows-per-page-options="[10, 20, 50, 0]"
      :pagination="{ rowsPerPage: 20, sortBy: 'nome' }"
      no-data-label="Nenhum membro encontrado"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
      class="cursor-pointer"
      @row-click="(_evt, row) => abrir(row.uuid)"
    >
      <template v-slot:body-cell-situacao="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.ativo ? 'positive' : 'grey-6'"
            :label="props.row.ativo ? 'Ativo' : 'Inativo'"
            class="q-mr-xs"
          />
          <q-badge v-if="props.row.membro" color="primary" label="Membro" class="q-mr-xs" />
          <q-badge v-if="props.row.batizado" color="blue-6" label="Batizado" class="q-mr-xs" />
          <q-badge v-if="props.row.transferido" color="orange-8" label="Transferido" />
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
            :to="{ name: 'membros.detalhe', params: { uuid: props.row.uuid } }"
            @click.stop
          >
            <q-tooltip>Ver membro</q-tooltip>
          </q-btn>
        </q-td>
      </template>
      <!-- Celular: cartões no lugar das linhas -->
      <template v-slot:item="props">
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-card flat bordered v-ripple class="table-card cursor-pointer" @click="abrir(props.row.uuid)">
            <q-card-section class="row no-wrap items-start q-gutter-x-sm">
              <div class="col" style="min-width: 0">
                <div class="table-card__title">{{ props.row.nome || 'Sem nome' }}</div>
                <div v-if="props.row.telefone" class="text-caption text-muted row no-wrap items-center q-mt-xs">
                  <q-icon name="phone" size="14px" class="q-mr-xs" /><span class="ellipsis">{{ props.cols.find((c: any) => c.name === 'telefone')?.value }}</span>
                </div>
                <div v-if="props.row.email" class="text-caption text-muted row no-wrap items-center q-mt-xs">
                  <q-icon name="mail" size="14px" class="q-mr-xs" /><span class="ellipsis">{{ props.row.email }}</span>
                </div>
                <div v-if="props.row.enderecoCidade" class="text-caption text-muted row no-wrap items-center q-mt-xs">
                  <q-icon name="place" size="14px" class="q-mr-xs" /><span class="ellipsis">{{ props.cols.find((c: any) => c.name === 'cidade')?.value }}</span>
                </div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-badge
                    :color="props.row.ativo ? 'positive' : 'grey-6'"
                    :label="props.row.ativo ? 'Ativo' : 'Inativo'"
                  />
                  <q-badge v-if="props.row.membro" color="primary" label="Membro" />
                  <q-badge v-if="props.row.batizado" color="blue-6" label="Batizado" />
                  <q-badge v-if="props.row.transferido" color="orange-8" label="Transferido" />
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
import { useQuasar } from "quasar";
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import type { Membro } from "src/@modules/membresia/membresia.http";
import { MembresiaService } from "./membresia.service";

function formatarTelefone(v: string | null) {
  if (!v) return "";
  const d = v.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
}

const COLUNAS = [
  { name: "nome", label: "Nome", field: "nome", align: "left" as const, sortable: true },
  {
    name: "telefone",
    label: "Telefone",
    field: "telefone",
    align: "left" as const,
    format: formatarTelefone,
  },
  { name: "email", label: "E-mail", field: "email", align: "left" as const },
  {
    name: "cidade",
    label: "Cidade",
    field: (row: Membro) => [row.enderecoCidade, row.enderecoUf].filter(Boolean).join(" / "),
    align: "left" as const,
    sortable: true,
  },
  { name: "situacao", label: "Situação", field: "ativo", align: "left" as const },
  { name: "acoes", label: "", field: "uuid", align: "right" as const },
];

const OPCOES_SITUACAO = [
  { label: "Todos", value: "todos" },
  { label: "Ativos", value: "ativos" },
  { label: "Membros", value: "membros" },
  { label: "Inativos", value: "inativos" },
];

export default defineComponent({
  name: "MembroListar",
  setup() {
    const $q = useQuasar();
    // Celular e tablet: lista em cartões; desktop: tabela.
    const modoCartoes = computed(() => $q.screen.lt.md);
    const $service = new MembresiaService();
    const $router = useRouter();

    const data = reactive({
      carregando: false,
      colunas: COLUNAS,
      opcoesSituacao: OPCOES_SITUACAO,
      membros: [] as Membro[],
      filtros: {
        busca: "",
        situacao: "todos",
      },
    });

    const membrosFiltrados = computed(() => {
      const termo = (data.filtros.busca ?? "").trim().toLowerCase();
      const termoDigitos = termo.replace(/\D/g, "");

      return data.membros.filter((m) => {
        if (data.filtros.situacao === "ativos" && !m.ativo) return false;
        if (data.filtros.situacao === "inativos" && m.ativo) return false;
        if (data.filtros.situacao === "membros" && !m.membro) return false;
        if (!termo) return true;

        return (
          (m.nome ?? "").toLowerCase().includes(termo) ||
          (m.email ?? "").toLowerCase().includes(termo) ||
          (!!termoDigitos &&
            ((m.cpf ?? "").includes(termoDigitos) || (m.telefone ?? "").includes(termoDigitos)))
        );
      });
    });

    async function carregar() {
      data.carregando = true;
      const membros = await $service.listar();
      if (membros) data.membros = membros;
      data.carregando = false;
    }

    function abrir(uuid: string) {
      void $router.push({ name: "membros.detalhe", params: { uuid } });
    }

    onMounted(() => void carregar());

    return {
      modoCartoes,
      ...toRefs(data),
      membrosFiltrados,
      abrir,
    };
  },
});
</script>
