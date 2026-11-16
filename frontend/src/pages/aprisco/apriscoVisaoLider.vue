<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="arrow_back" color="grey-7" :to="{ name: 'home' }" class="q-mr-sm" />
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ aprisco?.nome || (naoEncontrado ? "Aprisco" : "Carregando...") }}
        </p>
        <div v-if="aprisco && descricaoEncontro(aprisco)" class="text-caption text-grey-7">
          {{ descricaoEncontro(aprisco) }}
        </div>
      </div>
    </div>

    <div v-if="naoEncontrado" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="location_off" size="48px" />
      <p class="q-mt-md">Aprisco não encontrado.</p>
      <q-btn flat color="primary" label="Voltar" :to="{ name: 'home' }" />
    </div>

    <div v-if="aprisco" class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card v-ripple class="cursor-pointer q-hoverable full-height" @click="abrirEdicao">
          <q-card-section class="column items-center text-center q-py-lg">
            <q-icon name="edit" size="40px" color="primary" />
            <div class="text-h6 q-mt-sm">Editar aprisco</div>
            <div class="text-caption text-grey-7">Dados, localização e integrantes</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card v-ripple class="cursor-pointer q-hoverable full-height" @click="presencasAberto = true">
          <q-card-section class="column items-center text-center q-py-lg">
            <q-icon name="how_to_reg" size="40px" color="primary" />
            <div class="text-h6 q-mt-sm">Registrar presença</div>
            <div class="text-caption text-grey-7">Marque quem participou do encontro</div>
          </q-card-section>
        </q-card>
      </div>

      <aprisco-presencas v-model="presencasAberto" :aprisco-uuid="aprisco.uuid" />
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Aprisco } from "src/@modules/aprisco/aprisco.http";
import ApriscoPresencas from "./apriscoPresencas.vue";
import { ApriscoService, descricaoEncontro } from "./aprisco.service";

export default defineComponent({
  name: "ApriscoVisaoLider",
  components: { ApriscoPresencas },
  setup() {
    const $route = useRoute();
    const $router = useRouter();
    const $service = new ApriscoService();
    const uuid = computed(() => $route.params.uuid as string);

    const data = reactive({
      aprisco: null as Aprisco | null,
      naoEncontrado: false,
      presencasAberto: false,
    });

    async function carregar() {
      const aprisco = await $service.buscarPorUuid(uuid.value);
      data.aprisco = aprisco;
      data.naoEncontrado = !aprisco;
    }

    const abrirEdicao = () =>
      void $router.push({ name: "apriscos.detalhe", params: { uuid: uuid.value } });

    onMounted(() => void carregar());

    return {
      descricaoEncontro,
      ...toRefs(data),
      abrirEdicao,
    };
  },
});
</script>
