<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="arrow_back" color="grey-7" :to="{ name: 'usuarios' }" class="q-mr-sm" />
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ usuario?.name || "Carregando..." }}
        </p>
        <q-badge
          v-if="usuario"
          :color="usuario.isAccepted ? 'positive' : 'grey-6'"
          :label="usuario.isAccepted ? 'Ativo' : 'Pendente'"
          class="q-mt-xs"
        />
      </div>
      <div v-if="usuario" class="col-auto">
        <q-btn unelevated color="negative" label="Excluir" icon="delete" @click="excluir" />
      </div>
    </div>

    <div v-if="usuario" class="row q-col-gutter-md">
      <!-- Formulário -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <p class="text-subtitle1 text-weight-bold q-ma-none">Dados do Usuário</p>
              <div>
                <q-btn v-if="!editando" flat dense icon="edit" label="Editar" color="primary" @click="editando = true" />
                <div v-else class="row q-gutter-sm">
                  <q-btn flat dense label="Cancelar" color="grey-7" @click="cancelarEdicao" />
                  <q-btn unelevated dense label="Salvar" color="primary" icon="save" @click="salvar" />
                </div>
              </div>
            </div>

            <q-form greedy>
              <div class="row q-col-gutter-md">
                <!-- Identificação -->
                <div class="col-12">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">Identificação</p>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.name"
                    label="Nome"
                    filled
                    :readonly="!editando"
                    :rules="[(v) => !!v || 'Obrigatório']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model="form.cpf"
                    label="CPF"
                    filled
                    mask="###.###.###-##"
                    unmasked-value
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model="form.phone"
                    label="Telefone"
                    filled
                    mask="(##) #####-####"
                    fill-mask
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="form.email" label="E-mail" filled type="email" :readonly="!editando" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="form.position" label="Cargo" filled :readonly="!editando" />
                </div>

                <!-- Acesso -->
                <div class="col-12 q-mt-sm">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">Acesso</p>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.password"
                    label="Nova senha"
                    filled
                    type="password"
                    :readonly="!editando"
                    hint="Preencha apenas para alterar a senha atual"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.roles"
                    label="Papéis"
                    filled
                    multiple
                    use-input
                    use-chips
                    new-value-mode="add-unique"
                    hide-dropdown-icon
                    :readonly="!editando"
                    :disable="!editando"
                    @new-value="adicionarRole"
                  />
                </div>
                <div class="col-12">
                  <q-toggle v-model="form.isAccepted" label="Acesso liberado" :disable="!editando" />
                </div>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Painel lateral -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Informações</p>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="calendar_today" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Criado em</q-item-label>
                  <q-item-label>{{ formatarData(usuario.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="update" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Atualizado em</q-item-label>
                  <q-item-label>{{ formatarData(usuario.updatedAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="mark_email_read" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>E-mail verificado</q-item-label>
                  <q-item-label>{{ usuario.isVerify ? "Sim" : "Não" }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRoute } from "vue-router";
import { UsuarioService } from "./usuario.service";

export default defineComponent({
  name: "UsuarioEditar",
  setup() {
    const $route = useRoute();
    const $service = new UsuarioService();

    const data = reactive({
      usuario: null as any,
      editando: false,
      form: {
        name: "",
        cpf: "",
        email: "",
        phone: "",
        password: "",
        position: "",
        roles: [] as string[],
        isAccepted: true,
      },
    });

    function carregarForm(usuario: any) {
      data.form.name = usuario.name ?? "";
      data.form.cpf = usuario.cpf ?? "";
      data.form.email = usuario.email ?? "";
      data.form.phone = usuario.phone ?? "";
      data.form.password = "";
      data.form.position = usuario.position ?? "";
      data.form.roles = usuario.roles ?? [];
      data.form.isAccepted = usuario.isAccepted ?? true;
    }

    async function carregar() {
      const uuid = $route.params.uuid as string;
      const usuario = await $service.buscarPorUuid(uuid);
      if (usuario) {
        data.usuario = usuario;
        carregarForm(usuario);
      }
    }

    function adicionarRole(val: string, done: (val?: string) => void) {
      if (val) done(val);
    }

    async function salvar() {
      const uuid = $route.params.uuid as string;
      const ok = await $service.editar(uuid, {
        name: data.form.name,
        cpf: data.form.cpf || undefined,
        email: data.form.email || undefined,
        phone: data.form.phone || undefined,
        password: data.form.password || undefined,
        position: data.form.position || undefined,
        roles: data.form.roles,
        isAccepted: data.form.isAccepted,
      });
      if (ok) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      if (data.usuario) carregarForm(data.usuario);
    }

    async function excluir() {
      const uuid = $route.params.uuid as string;
      await $service.deletar(uuid);
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
      adicionarRole,
      salvar,
      cancelarEdicao,
      excluir,
      formatarData,
    };
  },
});
</script>
