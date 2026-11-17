<template>
  <div class="row">
    <!-- Username Input -->
    <div class="col-12 q-my-sm rounded-panel">
      <q-input
        filled
        stack-label
        unmasked-value
        autofocus
        v-model="input.username"
        autocomplete="username"
        inputmode="email"
        bg-color="grey-3"
        data-cy="username"
        type="text"
        label="Usuário"
        hint="CPF ou Email"
        :mask="`${isCpf(input.username) ? '###.###.###-##' : ''}`"
        @keyup.enter="inputPassword.focus()"
      />
    </div>

    <!-- Password Input -->
    <div class="col-12 q-my-sm rounded-panel">
      <q-input
        filled
        stack-label
        ref="inputPassword"
        autocomplete="current-password"
        bg-color="grey-3"
        v-model="input.password"
        :type="showPwd ? 'password' : 'text'"
        data-cy="password"
        label="Senha"
        @keyup.enter="login()"
      >
        <template v-slot:append>
          <q-icon
            :name="showPwd ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="showPwd = !showPwd"
          />
        </template>
      </q-input>
    </div>

    <!-- Trusted device + Forgot Password Link -->
    <div class="col-12 q-my-md row items-center justify-between no-wrap">
      <q-checkbox
        v-model="input.trustDevice"
        data-cy="trust-device"
        label="Confiar neste dispositivo"
        color="primary"
        dense
        class="text-grey-8"
      />
      <div class="text-right text-grey-8">
        <p class="text-subtitle2 cursor-pointer q-ma-none" @click="$emit('recover')">
          Recuperar conta
        </p>
      </div>
    </div>

    <!-- Login and Digital Certificate Buttons -->
    <div class="col-12 row no-wrap items-center q-gutter-x-sm q-mb-md">
      <div class="col">
        <q-btn
          unelevated
          data-cy="btn-login"
          label="Entrar"
          @click="login()"
          color="primary"
          size="lg"
          no-caps
          class="full-width login-btn"
        />
      </div>
      <div class="col-auto">
        <q-btn flat round color="grey-6" icon="developer_board" size="md">
          <q-tooltip>Acessar com Certificado Digital</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="col-12 q-my-md">
      <q-separator color="secondary" />
    </div>

    <!-- Social Login Section -->
    <!-- <div class="col-12" v-if="false">
      <q-separator color="secondary" />
      <p class="text-info text-center q-my-md text-subtitle1">Ou faça login com</p>
      <div class="row justify-center q-gutter-x-md q-mb-xl">
        <q-btn round flat size="sm" class="bg-grey-3">
          <q-img :src="facebookIcon" style="width: 24px" />
        </q-btn>
        <q-btn round flat size="sm" class="bg-grey-3">
          <q-img :src="xIcon" style="width: 24px" />
        </q-btn>
        <q-btn round flat size="sm" class="bg-grey-3">
          <q-img :src="googleIcon" style="width: 24px" />
        </q-btn>
      </div>
    </div> -->

    <!-- Sign Up Section -->
    <div class="col-12 text-center q-mt-md">
      <p class="q-ma-none text-subtitle1 text-grey-8">
        Não tem conta?
        <q-btn flat color="primary" label="Cadastrar" class="q-px-sm" @click="$emit('register')" />
      </p>
    </div>
    <!-- <span
      v-if="$q.platform.is.electron"
      class="q-pt-md cursor-pointer text-negative"
      @click="clearLocalStorage()"
    >
      <q-icon name="settings" class="" /> Limpar configurações
    </span> -->
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
import { LoginService } from "./login.service";
import { useLayoutStore } from "src/stores/layout";

export default defineComponent({
  name: "authLoginLoginForm",
  setup() {
    const $service = new LoginService();
    const $layoutStore = useLayoutStore();

    const data = reactive({
      inputPassword: ref(),
      // loginTemplate: computed(() => $setting.$state.template.login),
      showPwd: ref(true),
      authenticated: ref(false),
      layout: computed(() => $layoutStore.layout),
      input: ref({
        username: "",
        password: "",
        companyUuid: "",
        trustDevice: false,
      }),
    });

    function isCpf(cpf: string): boolean {
      return cpf.replace(/[^0-9]/g, "").length == 11;
    }

    function clearLocalStorage() {
      localStorage.clear();
      window.location.reload();
    }

    async function login() {
      await $service.login(data.input);
    }

    return {
      ...toRefs(data),
      login,
      clearLocalStorage,
      isCpf,
    };
  },
});
</script>

<style scoped>
.login-btn {
  border-radius: 10px;
  min-height: 48px;
}
</style>
