<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Canais de notificação</p>
        <p class="text-caption text-grey-6 q-ma-none">
          Gerencie os canais de notificação da sua comunidade
        </p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-card class="my-card">
          <q-card-section>
            <div class="text-h6">Email</div>
            <div class="text-subtitle2 text-grey-8">Informa os credenciais da sua conta para envio de emails</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-select
                  outlined
                  dense
                  map-options
                  emit-value
                  v-model="gatewayEmail.name"
                  :options="[
                    { label: 'Gmail', value: 'smtp-gmail' }
                  ]"
                  label="Gateway" />
              </div>
              <div class="col-12">
                <q-input
                  outlined
                  dense
                  v-model="gatewayEmail.usuario"
                  label="Usuário" />
              </div>
              <div class="col-12">
                <q-input
                  outlined
                  dense
                  v-model="gatewayEmail.senha"
                  label="Senha" />
              </div>
              <div class="col-12 row">
                <q-toggle
                  label="Ativo"
                  v-model="gatewayEmail.status"
                  false-value="inativo"
                  true-value="ativo" />
                <q-space />
                <q-btn flat no-caps color="primary" label="Salvar" @click="salvarGateway(gatewayEmail)" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
<script lang="ts">
import { defineComponent, onMounted, reactive, ref, toRefs } from "vue";
import { NotigicacaoService } from "./notificacao.service";

export default defineComponent({
  name: "NotificacaoHome",
  setup() {
    const $service = new NotigicacaoService();

    const data = reactive({
      gateways: ref([] as any[]),
      gatewayEmail: ref({ type: "email", status: "ativo", meta: {} } as any),
    });

    onMounted(async () => {
      await listarGateways();
    });

    async function listarGateways() {
      const response = await $service.listarGateways();
      data.gateways = response.data;
      const gatewayEmail = data.gateways.find(g => g.type === "email");
      if (gatewayEmail) data.gatewayEmail = gatewayEmail;
    }

    async function salvarGateway(gateway: any) {
      try {
        await $service.salvarGateway(gateway);
      } catch (error) {}
    }

    return {
      ...toRefs(data),
      salvarGateway
    }
    
  }
});
</script>
<style></style>