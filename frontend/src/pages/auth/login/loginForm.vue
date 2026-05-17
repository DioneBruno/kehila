<template>
  <div class="row">
    <div class="col-12 q-my-md">
      <q-separator color="secondary" />
    </div>

    <div class="col-12 q-my-md"></div>
    <!-- Username Input -->
    <div class="col-12 q-my-sm rounded-panel">
      <q-input
        filled
        stack-label
        unmasked-value
        autofocus
        v-model="input.username"
        autocomplete="off"
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
        autocomplete="off"
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

    <!-- Forgot Password Link -->
    <div class="col-12 q-my-md">
      <div class="text-right text-grey-8">
        <p class="text-subtitle2 cursor-pointer q-ma-none" @click="$emit('recover')">
          Recuperar conta
        </p>
      </div>
    </div>

    <!-- Login and Digital Certificate Buttons -->
    <div class="col-12 row justify-between items-center q-mb-xl">
      <div class="col-9">
        <q-btn
          unelevated
          data-cy="btn-login"
          label="Entrar"
          @click="login()"
          color="primary"
          class="full-width"
        />
      </div>
      <div class="col-2 text-right">
        <q-btn flat color="grey-6" icon="developer_board" size="md">
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
import { defineComponent, reactive, ref, toRefs } from "vue";
import { LoginService } from "./login.service";

export default defineComponent({
  name: "authLoginLoginForm",
  setup() {
    const $service = new LoginService();

    const data = reactive({
      inputPassword: ref(),
      // loginTemplate: computed(() => $setting.$state.template.login),
      showPwd: ref(true),
      authenticated: ref(false),
      input: ref({
        username: "",
        password: "",
        companyUuid: "",
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
      const response = await $service.login(data.input);
      console.log(response);
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

<style></style>
