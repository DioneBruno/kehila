<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <!-- <div class="col-12 col-sm-4 col-md-2 cursor-pointer">
        <q-card>
          <q-card-section>
            <div class="text-h6">Home</div>
          </q-card-section>
          <q-card-section>
            <div class="text-subtitle1">Home</div>
          </q-card-section>
          <q-card-section> </q-card-section>
        </q-card>
      </div> -->

      <!-- Apriscos em que o usuário logado é líder -->
      <div
        v-for="aprisco in apriscosLiderados"
        :key="aprisco.uuid"
        class="col-12 col-sm-4 col-md-2"
      >
        <q-card v-ripple class="cursor-pointer q-hoverable" @click="abrirAprisco(aprisco.uuid)">
          <q-card-section>
            <div class="text-overline text-primary">
              <q-icon name="star" class="q-mr-xs" />Meu aprisco
            </div>
            <div class="text-h6 ellipsis">{{ aprisco.nome }}</div>
            <div v-if="aprisco.horario" class="text-caption text-grey-7">{{ aprisco.horario }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat dense no-caps color="primary" label="Acessar" icon-right="chevron_right" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import type { Aprisco } from "src/@modules/aprisco/aprisco.http";
import { ApriscoService } from "./aprisco/aprisco.service";

export default defineComponent({
  name: "pageHome",
  setup() {
    const apriscoService = new ApriscoService();
    const router = useRouter();
    const data = reactive({
      apriscosLiderados: [] as Aprisco[],
    });

    onMounted(async () => {
      data.apriscosLiderados = await apriscoService.listarLiderados();
    });

    const abrirAprisco = (uuid: string) =>
      router.push({ name: "apriscos.lider", params: { uuid } });

    return {
      ...toRefs(data),
      abrirAprisco,
    };
  },
});
</script>
