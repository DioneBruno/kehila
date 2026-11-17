<template>
  <q-page class="login-page">
    <!-- Imagem de fundo -->
    <q-img
      src="https://ministeriofiel.com.br/wp-content/uploads/2023/04/orac%CC%A7a%CC%83o-1.png"
      fit="cover"
      class="login-page__bg"
      no-spinner
    />
    <div class="login-page__overlay" />

    <!-- Painel de login: centralizado no celular, à direita no desktop -->
    <div class="login-page__panel">
      <q-card class="login-card">
        <q-card-section class="text-center q-pb-none">
          <div class="text-h5 text-weight-bold text-grey-9">{{ layout?.telaLogin?.titulo }}</div>
          <div v-if="layout?.telaLogin?.subTitulo" class="text-caption text-grey-7">
            {{ layout?.telaLogin?.subTitulo }}
          </div>
        </q-card-section>
        <q-card-section>
          <LoginForm v-if="mostrarFormulario" />
          <div v-else class="row justify-center q-pa-lg">
            <q-spinner color="primary" size="40px" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watchEffect } from "vue";
import LoginForm from "./loginForm.vue";
import { LoginService } from "./login.service";
import { useLayoutStore } from "src/stores/layout.js";

export default defineComponent({
  name: "authLoginHome",
  components: {
    LoginForm,
  },
  setup() {
    const $layoutStore = useLayoutStore();
    const $service = new LoginService();

    const data = reactive({
      layout: computed(() => $layoutStore.layout),
      mostrarFormulario: ref(false),
    });

    onMounted(async () => {
      const entrou = await $service.loginDispositivoConfiavel();
      if (!entrou) data.mostrarFormulario = true;
    });

    watchEffect(() => {
      const titulo = $layoutStore.layout?.telaLogin?.titulo;
      if (titulo) document.title = titulo;
    });

    return {
      ...toRefs(data),
    };
  },
});
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 24px max(24px, 5vw);
  overflow: hidden;
}

.login-page__bg,
.login-page__overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.login-page__bg {
  width: 100%;
  height: 100%;
}

.login-page__overlay {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.35) 100%);
}

.login-page__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}

.login-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  padding: 8px;
}

/* Tablet: centralizado */
@media (max-width: 1023.98px) {
  .login-page {
    justify-content: center;
  }

  .login-page__overlay {
    background: rgba(0, 0, 0, 0.3);
  }
}

/* Celular: cartão ocupa a largura, ancorado embaixo para alcance do polegar */
@media (max-width: 599.98px) {
  .login-page {
    padding: 16px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    align-items: flex-end;
  }

  .login-card {
    padding: 4px;
  }
}
</style>
