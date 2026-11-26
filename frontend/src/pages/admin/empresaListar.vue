<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Empresas</p>
        <p class="text-caption text-grey-6 q-ma-none">Empresas cadastradas na plataforma</p>
      </div>
      <div class="col-auto">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nova empresa"
          :to="{ name: 'admin.empresas.criar' }"
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
            placeholder="Buscar nome, CNPJ ou domínio..."
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
      :rows="itens"
      :columns="colunas"
      row-key="uuid"
      :loading="carregando"
      :rows-per-page-options="[10, 20, 50]"
      no-data-label="Nenhuma empresa encontrada"
      loading-label="Carregando..."
      rows-per-page-label="Por página"
      class="cursor-pointer"
      @request="aoPaginar"
      @row-click="(_evt, row) => abrir(row.uuid)"
    >
      <template v-slot:body-cell-dominios="props">
        <q-td :props="props">
          <div v-if="props.row.dominios.length === 0" class="text-grey-6">-</div>
          <div v-for="d in props.row.dominios" :key="d">{{ d }}</div>
        </q-td>
      </template>
      <template v-slot:body-cell-modulos="props">
        <q-td :props="props">
          <q-chip
            v-for="m in props.row.modulos"
            :key="m"
            dense
            color="primary"
            text-color="white"
            :label="labelModulo(m)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs, watch } from "vue";
import { useRouter } from "vue-router";
import type { EmpresaResumo } from "src/@modules/admin/empresa.http";
import { AdminEmpresaService, labelModulo } from "./admin.service";

const COLUNAS = [
  { name: "nome", label: "Nome", field: "name", align: "left" as const },
  { name: "cpfCnpj", label: "CNPJ", field: "cpfCnpj", align: "left" as const },
  { name: "dominios", label: "Domínios", field: "dominios", align: "left" as const },
  { name: "modulos", label: "Módulos", field: "modulos", align: "left" as const },
];

export default defineComponent({
  name: "AdminEmpresaListar",
  setup() {
    const $router = useRouter();
    const $service = new AdminEmpresaService();

    const data = reactive({
      carregando: false,
      itens: [] as EmpresaResumo[],
      busca: "",
      paginacao: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
    });

    async function carregar() {
      data.carregando = true;
      const resultado = await $service.listar({
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
      void $router.push({ name: "admin.empresas.editar", params: { uuid } });
    }

    watch(
      () => data.busca,
      () => {
        data.paginacao.page = 1;
        void carregar();
      },
    );
    onMounted(() => void carregar());

    return { ...toRefs(data), colunas: COLUNAS, aoPaginar, abrir, labelModulo };
  },
});
</script>
