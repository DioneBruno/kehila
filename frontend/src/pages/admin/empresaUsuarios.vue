<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm">
          <q-input
            v-model="busca"
            dense
            outlined
            clearable
            debounce="400"
            placeholder="Buscar por nome, e-mail ou CPF..."
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-auto">
          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Novo usuário"
            @click="abrirDialog()"
          />
        </div>
      </div>

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
        <template v-slot:body-cell-position="props">
          <q-td :props="props">{{ labelCargo(props.row.position) }}</q-td>
        </template>

        <template v-slot:body-cell-isAccepted="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.isAccepted ? 'positive' : 'grey-6'"
              :label="props.row.isAccepted ? 'Ativo' : 'Inativo'"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-acoes="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" color="primary" @click="abrirDialog(props.row.uuid)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat dense round icon="delete" color="negative" @click="remover(props.row.uuid)">
              <q-tooltip>Remover acesso</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card-section>

    <empresa-usuario-dialog
      v-model="dialog.aberto"
      :empresa-uuid="empresaUuid"
      :usuario-uuid="dialog.usuarioUuid"
      @salvo="carregar(paginacao.page, paginacao.rowsPerPage)"
    />
  </q-card>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs, watch } from "vue";
import type { EmpresaUsuarioItem } from "src/@modules/admin/empresa.http";
import { AdminEmpresaService, labelCargo } from "./admin.service";
import EmpresaUsuarioDialog from "./empresaUsuarioDialog.vue";

const COLUNAS = [
  { name: "name", label: "Nome", field: "name", align: "left" as const },
  { name: "email", label: "E-mail", field: "email", align: "left" as const },
  { name: "position", label: "Cargo", field: "position", align: "left" as const },
  { name: "isAccepted", label: "Ativo", field: "isAccepted", align: "left" as const },
  { name: "acoes", label: "", field: "acoes", align: "right" as const },
];

export default defineComponent({
  name: "AdminEmpresaUsuarios",
  components: { EmpresaUsuarioDialog },
  props: {
    empresaUuid: { type: String, required: true },
  },
  setup(props) {
    const $service = new AdminEmpresaService();

    const data = reactive({
      carregando: false,
      busca: "",
      usuarios: [] as EmpresaUsuarioItem[],
      paginacao: { page: 1, rowsPerPage: 20, rowsNumber: 0 },
      dialog: { aberto: false, usuarioUuid: undefined as string | undefined },
    });

    async function carregar(pagina = 1, porPagina = 20) {
      data.carregando = true;
      const resposta = await $service.listarUsuarios(props.empresaUuid, {
        busca: data.busca?.trim() || undefined,
        pagina,
        porPagina,
      });
      if (resposta) {
        data.usuarios = resposta.itens;
        data.paginacao.rowsNumber = resposta.total;
        data.paginacao.page = pagina;
        data.paginacao.rowsPerPage = porPagina;
      }
      data.carregando = false;
    }

    function onRequest(req: { pagination: { page: number; rowsPerPage: number } }) {
      void carregar(req.pagination.page, req.pagination.rowsPerPage);
    }

    function abrirDialog(usuarioUuid?: string) {
      data.dialog.usuarioUuid = usuarioUuid;
      data.dialog.aberto = true;
    }

    async function remover(usuarioUuid: string) {
      const ok = await $service.deletarUsuario(props.empresaUuid, usuarioUuid);
      if (ok) await carregar(data.paginacao.page, data.paginacao.rowsPerPage);
    }

    watch(
      () => data.busca,
      () => void carregar(1, data.paginacao.rowsPerPage),
    );

    onMounted(() => void carregar());

    return { ...toRefs(data), colunas: COLUNAS, labelCargo, onRequest, abrirDialog, remover, carregar };
  },
});
</script>
