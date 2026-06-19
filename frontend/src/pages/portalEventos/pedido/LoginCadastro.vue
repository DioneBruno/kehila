<template>
  <div>
    <div v-if="form === 'login'">
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
            :disable="codigoEnviado"
            lazy-rules
          />
        </div>
        <div v-if="codigoEnviado" class="col-12">
          <q-input
            outlined
            dense
            stack-label
            v-model="loginData.code"
            label="Código recebido *"
            :rules="[(v) => !!v || 'Obrigatório']"
            lazy-rules
          />
          <div class="text-caption text-grey-6 q-mt-xs">
            Um código foi enviado para o seu email/celular.
            <a class="cursor-pointer text-primary" @click="reenviarCodigo()">Reenviar</a>
          </div>
        </div>
        <div class="col-12 text-right q-mt-sm">
          <q-btn
            no-caps
            unelevated
            :label="codigoEnviado ? 'Validar código' : 'Enviar código'"
            color="primary"
            :icon-right="codigoEnviado ? 'login' : 'send'"
            @click="loginUsuario()"
          />
        </div>
      </div>
    </div>

    <q-form ref="formRef" greedy v-if="form === 'novoUsuario'">
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
        <div class="col-12 text-right q-mt-sm">
          <q-btn
            no-caps
            unelevated
            label="Cadastrar-se"
            color="green-9"
            icon-right="chevron_right"
            @click="cadastrarUsuario()"
          />
        </div>
      </div>
    </q-form>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { useAuthStore } from "src/stores/auth";
import { usePedidoStore } from "src/stores/pedido";

export default defineComponent({
  name: "LoginCadastro",
  props: {
    formInicial: { type: String, default: "novoUsuario" },
  },
  setup(props, { expose }) {
    const $authStore = useAuthStore();
    const $pedidoStore = usePedidoStore();
    const $service = new PedidoService();

    const data = reactive({
      form: props.formInicial,
      evento: computed(() => $pedidoStore.$state.evento),
      user: computed(() => $authStore.$state.user),
      loginData: { username: "", code: "" },
      codigoEnviado: false,
    });

    async function verificaUsuario() {
      await $service.verificaUsuario();
    }

    async function cadastrarUsuario() {
      await $service.cadastrarUsuario(data.user);
      await verificaUsuario();
    }

    function entrarComUsuarioCadastrado() {
      data.form = "login";
    }

    async function loginUsuario() {
      if (!data.codigoEnviado) {
        await $service.gerarCodigoLogin(data.loginData.username);
        data.codigoEnviado = true;
        return;
      }
      await $service.validarCodigoLogin({
        username: data.loginData.username,
        code: data.loginData.code,
        companyUuid: data.evento.companyUuid,
      });
      await verificaUsuario();
    }

    async function reenviarCodigo() {
      await $service.gerarCodigoLogin(data.loginData.username);
    }

    function mostrarLogin() {
      data.form = "login";
      data.codigoEnviado = false;
    }

    function mostrarCadastro() {
      data.form = "novoUsuario";
    }

    expose({ mostrarLogin, mostrarCadastro });

    return {
      ...toRefs(data),
      cadastrarUsuario,
      entrarComUsuarioCadastrado,
      loginUsuario,
      reenviarCodigo,
    };
  },
});
</script>
