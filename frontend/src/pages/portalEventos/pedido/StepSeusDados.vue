<template>
  <div>
    <LoginCadastro v-if="!user.uuid" ref="loginCadastroRef" />

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
    </q-stepper-navigation>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs } from "vue";
import { PedidoService } from "./pedido.service";
import { useAuthStore } from "src/stores/auth";
import LoginCadastro from "./LoginCadastro.vue";

export default defineComponent({
  name: "StepSeusDados",
  components: { LoginCadastro },
  props: {},
  emits: ["next", "prev"],
  setup(props, { emit }) {
    const $authStore = useAuthStore();
    const $service = new PedidoService();

    const data = reactive({
      user: computed(() => $authStore.$state.user),
    });

    const loginCadastroRef = ref<any>(null);

    onMounted(async () => {
      await verificaUsuario();
    });

    async function verificaUsuario() {
      await $service.verificaUsuario();
    }

    function trocarUsuario() {
      $authStore.setUser({});
      loginCadastroRef.value?.mostrarLogin();
    }

    function novoUsuario() {
      $authStore.setUser({});
      loginCadastroRef.value?.mostrarCadastro();
    }

    function avancar() {
      emit("next");
    }

    return {
      ...toRefs(data),
      loginCadastroRef,
      novoUsuario,
      trocarUsuario,
      avancar,
    };
  },
});
</script>
