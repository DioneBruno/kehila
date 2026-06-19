<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Usuários</p>
        <p class="text-caption text-grey-6 q-ma-none">Gerencie os usuários da empresa</p>
      </div>
      <div class="col-auto">
        <q-btn unelevated color="primary" icon="add" label="Novo Usuário" :to="{ name: 'usuarios.criar' }" />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-gutter-md items-center">
        <q-input
          v-model="filtros.busca"
          dense
          outlined
          placeholder="Buscar por nome, e-mail ou CPF..."
          clearable
          class="col-12 col-sm-4"
          @update:model-value="buscar"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>
    </q-card>

    <!-- Tabela -->
    <q-table
      flat
      bordered
      :rows="usuarios"
      :columns="colunas"
      row-key="uuid"
      :loading="carregando"
      :rows-per-page-options="[10, 20, 50]"
      v-model:pagination="paginacao"
      @request="onRequest"
      no-data-label="Nenhum usuário encontrado"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
    >
      <template v-slot:body-cell-isAccepted="props">
        <q-td :props="props">
          <q-badge
            :color="props.value ? 'positive' : 'grey-6'"
            :label="props.value ? 'Ativo' : 'Pendente'"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-roles="props">
        <q-td :props="props">
          <q-badge
            v-for="role in props.value"
            :key="role"
            color="blue-grey-6"
            :label="role"
            class="q-mr-xs"
          />
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
            :to="{ name: 'usuarios.detalhe', params: { uuid: props.row.uuid } }"
          >
            <q-tooltip>Ver usuário</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { UsuarioService } from "./usuario.service";

const COLUNAS = [
  { name: "name", label: "Nome", field: "name", align: "left" as const, sortable: true },
  { name: "email", label: "E-mail", field: "email", align: "left" as const },
  { name: "cpf", label: "CPF", field: "cpf", align: "left" as const },
  { name: "position", label: "Cargo", field: "position", align: "left" as const },
  { name: "roles", label: "Papéis", field: "roles", align: "left" as const },
  { name: "isAccepted", label: "Status", field: "isAccepted", align: "left" as const },
  { name: "acoes", label: "", field: "acoes", align: "right" as const },
] as const;

export default defineComponent({
  name: "UsuarioListar",
  setup() {
    const $service = new UsuarioService();

    const data = reactive({
      carregando: false,
      colunas: COLUNAS,
      usuarios: [] as any[],
      filtros: {
        busca: "",
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
        pagina,
        porPagina,
      });
      if (resposta) {
        data.usuarios = resposta.data;
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

    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      onRequest,
      buscar,
    };
  },
});
</script>
