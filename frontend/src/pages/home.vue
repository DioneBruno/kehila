<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-4 col-md-2 cursor-pointer">
        <q-card>
          <q-card-section>
            <div class="text-h6">Home</div>
          </q-card-section>
          <q-card-section>
            <div class="text-subtitle1">Home</div>
          </q-card-section>
          <q-card-section>
            <div class="text-body1">
              <q-btn label="Enviar SMS" @click="enviarSms" />
              <q-btn label="Enviar Email" @click="enviarEmail" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import { HomeService } from "./home.service";

export default defineComponent({
  name: "pageHome",
  setup() {
    const $homeService = new HomeService();
    const data = reactive({});

    async function enviarSms() {
      await $homeService.enviarSms({
        gateway: "vonage",
        destinatario: "5569984852834",
        mensagem: "Teste",
      });
    }

    async function enviarEmail() {
      await $homeService.enviarEmail({
        gateway: "smtp",
        destinatario: "dionebruno88@gmail.com",
        titulo: "Teste",
        mensagem: "Teste",
      });
    }

    return {
      ...toRefs(data),
      enviarSms,
      enviarEmail,
    };
  },
});
</script>
