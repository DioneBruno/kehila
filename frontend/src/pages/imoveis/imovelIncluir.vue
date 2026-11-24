<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: 'imoveis.imoveis' }"
        class="q-mr-sm"
      />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Novo imóvel</p>
        <p class="text-caption text-grey-6 q-ma-none">Preencha os dados do imóvel</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <q-card flat bordered>
        <q-card-section>
          <imovel-form :form="form" />
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm form-actions q-mt-md">
        <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'imoveis.imoveis' }" />
        <q-btn unelevated type="submit" label="Cadastrar imóvel" color="primary" icon="save" />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";
import ImovelForm, { imovelFormParaInput, novoImovelForm } from "./imovelForm.vue";
import { ImoveisService } from "./imoveis.service";

export default defineComponent({
  name: "ImovelIncluir",
  components: { ImovelForm },
  setup() {
    const $service = new ImoveisService();
    const form = reactive(novoImovelForm());

    async function salvar() {
      // A situação inicial é sempre "livre" no backend; o campo só vale na alteração.
      const input = imovelFormParaInput(form);
      delete input.situacao;
      await $service.incluirImovel(input);
    }

    return { form, salvar };
  },
});
</script>
