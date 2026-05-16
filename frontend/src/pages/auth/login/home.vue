<template>
  <q-page class="row full-height">
    <!-- Imagem de fundo -->
    <div class="absolute-full" style="z-index: -1">
      <q-img
        src="https://ministeriofiel.com.br/wp-content/uploads/2023/04/orac%CC%A7a%CC%83o-1.png"
        fit="cover"
        style="width: 100%; height: 100%"
      />
    </div>

    <!-- Painel de login -->
    <div class="fit row justify-end full-height align-items-center">
      <div class="col-12 col-sm-6 col-md-5 col-lg-4 q-pa-md custom-border">
        <div
          class="flex justify-center items-center column fit bg-grey-1 full--width rounded-panel q-pa-md shadow-7 card-hover"
          style="opacity: 0.93; max-width: 400px; width: 100%; padding: 16px; margin: auto"
        >
          <div class="row col-11 col-sm-7 col-md-5">
            <!-- Logo Section -->
            <div class="column col-11 col-md-7 q-mx-auto">
              <p class="text-h4 col-12 q-ma-none q-py-md text-center">
                Kehila
                <!-- <q-img
                  v-if="!loginTemplate.logo.title"
                  :src="eomnesLogo"
                  :class="loginTemplate.logo.class"
                  :style="loginTemplate.logo.style"
                  fit="contain"
                /> -->
              </p>
              <!-- <q-img
                v-else-if="loginTemplate.logo.type === 'image'"
                :src="loginTemplate.logo.srcImg ? loginTemplate.logo.srcImg : eomnesLogo"
                :class="loginTemplate.logo.class"
                :style="loginTemplate.logo.style"
                fit="contain"
              /> -->
            </div>
            <div class="col-12">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import LoginForm from "./loginForm.vue";

export default defineComponent({
  name: "authLoginHome",
  components: {
    LoginForm,
  },
  setup() {
    const data = reactive({});

    return {
      ...toRefs(data),
    };
  },
});
</script>

<style scoped>
.full-height {
  height: 100vh;
}

.row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* height: 100vh; */
}

.q-page {
  padding-right: 2vw;
}

.rounded-panel {
  border-radius: 12px;
  overflow: hidden;
}

.shadow-4 {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>
