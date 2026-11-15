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
        :to="{ name: 'membros' }"
        class="q-mr-sm"
      />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Novo Membro</p>
        <p class="text-caption text-grey-6 q-ma-none">Preencha os dados do membro</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <q-card flat bordered>
        <q-card-section>
          <membro-form :form="form" />
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm q-mt-md">
        <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'membros' }" />
        <q-btn unelevated type="submit" label="Cadastrar Membro" color="primary" icon="save" />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";
import MembroForm, { membroFormParaInput, novoMembroForm } from "./membroForm.vue";
import { MembresiaService } from "./membresia.service";

export default defineComponent({
  name: "MembroIncluir",
  components: { MembroForm },
  setup() {
    const $service = new MembresiaService();
    const form = reactive(novoMembroForm());

    async function salvar() {
      await $service.incluir(membroFormParaInput(form));
    }

    return { form, salvar };
  },
});
</script>
