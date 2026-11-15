<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: 'apriscos' }"
        class="q-mr-sm"
      />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Novo Aprisco</p>
        <p class="text-caption text-grey-6 q-ma-none">Preencha os dados do aprisco</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <q-card flat bordered>
        <q-card-section>
          <aprisco-form :form="form" />
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm q-mt-md">
        <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'apriscos' }" />
        <q-btn unelevated type="submit" label="Cadastrar Aprisco" color="primary" icon="save" />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";
import ApriscoForm, { apriscoFormParaInput, novoApriscoForm } from "./apriscoForm.vue";
import { ApriscoService } from "./aprisco.service";

export default defineComponent({
  name: "ApriscoIncluir",
  components: { ApriscoForm },
  setup() {
    const $service = new ApriscoService();
    const form = reactive(novoApriscoForm());

    async function salvar() {
      await $service.incluir(apriscoFormParaInput(form));
    }

    return { form, salvar };
  },
});
</script>
