<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="arrow_back" color="grey-7" :to="{ name: 'usuarios' }" class="q-mr-sm" />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Novo Usuário</p>
        <p class="text-caption text-grey-6 q-ma-none">Preencha os dados do usuário</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <div class="row q-col-gutter-md">
        <!-- Identificação -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Identificação</p>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.name"
                    label="Nome *"
                    filled
                    :rules="[(v) => !!v || 'O nome é obrigatório']"
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
                    hint="Informe o CPF ou o e-mail"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input v-model="form.phone" label="Telefone" filled mask="(##) #####-####" fill-mask />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="form.email" label="E-mail" filled type="email" hint="Informe o CPF ou o e-mail" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.position"
                    label="Cargo"
                    filled
                    hint="Ex: Administrador, Financeiro, Atendimento"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Acesso -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Acesso</p>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.password"
                    label="Senha"
                    filled
                    type="password"
                    hint="Se não for informada, o usuário não poderá fazer login até definir uma senha"
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
                    hint="Digite e pressione Enter para adicionar"
                    @new-value="adicionarRole"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Ações -->
        <div class="col-12">
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'usuarios' }" />
            <q-btn unelevated type="submit" label="Criar Usuário" color="primary" icon="save" />
          </div>
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import { UsuarioService } from "./usuario.service";

export default defineComponent({
  name: "UsuarioIncluir",
  setup() {
    const $service = new UsuarioService();

    const data = reactive({
      form: {
        name: "",
        cpf: "",
        email: "",
        phone: "",
        password: "",
        position: "",
        roles: [] as string[],
      },
    });

    function adicionarRole(val: string, done: (val?: string) => void) {
      if (val) done(val);
    }

    async function salvar() {
      await $service.criar({
        name: data.form.name,
        cpf: data.form.cpf || undefined,
        email: data.form.email || undefined,
        phone: data.form.phone || undefined,
        password: data.form.password || undefined,
        position: data.form.position || undefined,
        roles: data.form.roles,
      });
    }

    return {
      ...toRefs(data),
      adicionarRole,
      salvar,
    };
  },
});
</script>
