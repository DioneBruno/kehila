<template>
  <div>
    <q-form ref="loginFormRef" greedy v-if="!user.uuid && form == 'login'">
      <div class="row q-col-gutter-xs">
        <div class="col-12 q-pb-md text-grey-8">
          <span>Entrar com usuário cadastrado</span>
        </div>
        <div class="col-12 q-mb-sm">
          <q-btn
            flat
            dense
            no-caps
            class="full-width"
            color="primary"
            icon="person_add"
            label="Criar novo cadastro"
            @click="form = 'novoUsuario'"
          />
        </div>
        <div class="col-12">
          <q-input
            outlined
            dense
            stack-label
            v-model="loginData.username"
            label="Email ou CPF *"
            lazy-rules
          />
        </div>
        <div class="col-12">
          <q-input
            outlined
            dense
            stack-label
            v-model="loginData.password"
            label="Senha *"
            :type="mostrarSenha ? 'text' : 'password'"
            :rules="[(v) => !!v || 'Obrigatório']"
            lazy-rules
          >
            <template #append>
              <q-icon
                :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="mostrarSenha = !mostrarSenha"
              />
            </template>
          </q-input>
        </div>
      </div>
    </q-form>

    <q-form ref="formRef" greedy v-if="!user.uuid && form == 'novoUsuario'">
      <div class="row q-col-gutter-xs">
        <div class="col-12 q-pb-md text-grey-8">
          <span>Dados do usuário principal</span>
        </div>
        <div class="col-12 q-mb-sm">
          <q-btn
            flat
            dense
            no-caps
            class="full-width"
            color="primary"
            icon="person"
            label="Já tenho cadastro"
            @click="entrarComUsuarioCadastrado"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-input
            outlined
            dense
            unmasked-value
            stack-label
            v-model="user.cpf"
            label="CPF *"
            mask="###.###.###-##"
            :rules="[(v) => !!v || 'Obrigatório']"
            lazy-rules
          />
        </div>
        <div class="col-12 col-sm-8">
          <q-input
            outlined
            dense
            stack-label
            v-model="user.name"
            label="Nome completo *"
            :rules="[(v) => !!v || 'Obrigatório']"
            lazy-rules
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            outlined
            dense
            stack-label
            v-model="user.email"
            label="E-mail *"
            type="email"
            :rules="[(v) => !!v || 'Obrigatório']"
            lazy-rules
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            unmasked-value
            outlined
            dense
            stack-label
            fill-mask
            v-model="user.phone"
            label="Celular *"
            mask="(##) #####-####"
            :rules="[(v) => !!v || 'Obrigatório']"
            lazy-rules
          />
        </div>
      </div>
    </q-form>

    <div v-if="user.uuid">
      <div class="text-grey-8 q-pb-sm">Dados do usuário principal</div>
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-auto">
            <q-avatar color="primary" text-color="white" icon="person" />
          </div>
          <div class="col">
            <div class="text-subtitle2 text-weight-medium">{{ user.name }}</div>
            <div class="text-caption text-grey-6">{{ user.email }}</div>
          </div>
        </div>
        <q-separator class="q-my-sm" />
        <div class="row q-col-gutter-md">
          <q-btn
            flat
            dense
            no-caps
            class="col-12 full-width"
            color="primary"
            icon="swap_horiz"
            label="Trocar usuário"
            @click="trocarUsuario()"
          />
          <q-btn
            flat
            dense
            no-caps
            class="col-12 full-width"
            color="green-8"
            icon="person_add"
            label="Cadastrar novo usuário"
            @click="novoUsuario()"
          />
        </div>
      </q-card>
    </div>

    <q-stepper-navigation class="row">
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
      <q-space />
      <q-btn
        v-if="user.uuid"
        unelevated
        label="Continuar"
        color="primary"
        icon-right="chevron_right"
        @click="avancar()"
      />
      <q-btn
        v-else-if="form == 'login'"
        no-caps
        unelevated
        label="Entrar"
        color="primary"
        icon-right="login"
        @click="loginUsuario()"
      />
      <q-btn
        v-else
        no-caps
        unelevated
        label="Cadastrar-se"
        color="green-9"
        icon-right="chevron_right"
        @click="cadastrarUsuario()"
      />
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { useAuthStore } from "src/stores/auth";

export default defineComponent({
  name: "StepSeusDados",
  props: {},
  emits: ["next", "prev"],
  setup(props, { emit }) {
    const $authStore = useAuthStore();
    const $service = new PedidoService();

    const data = reactive({
      form: ref("novoUsuario"),
      user: computed(() => $authStore.$state.user),
      loginData: { username: "", password: "" },
      mostrarSenha: false,
    });

    onMounted(async () => {
      await verificaUsuario();
    });

    async function cadastrarUsuario() {
      await $service.cadastrarUsuario(data.user);
      await verificaUsuario();
    }

    async function verificaUsuario() {
      await $service.verificaUsuario();
    }

    function entrarComUsuarioCadastrado() {
      data.form = "login";
    }

    async function loginUsuario() {
      await $service.loginUsuario(data.loginData);
      await verificaUsuario();
    }

    function trocarUsuario() {
      $authStore.setUser({});
      data.form = "login";
    }

    function novoUsuario() {
      $authStore.setUser({});
      data.form = "novoUsuario";
    }

    function avancar() {
      if (!data.user.uuid) {
        cadastrarUsuario();
        return;
      }
      emit("next");
    }

    return {
      ...toRefs(data),
      novoUsuario,
      cadastrarUsuario,
      loginUsuario,
      entrarComUsuarioCadastrado,
      trocarUsuario,
      avancar,
    };
  },
});
</script>
