<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: voltar }"
        class="q-mr-sm"
      />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Nova pessoa</p>
        <p class="text-caption text-grey-6 q-ma-none">Preencha os dados cadastrais</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <q-card flat bordered>
        <q-card-section>
          <pessoa-form :form="form" />
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm form-actions q-mt-md">
        <q-btn flat label="Cancelar" color="grey-7" :to="{ name: voltar }" />
        <q-btn unelevated type="submit" label="Cadastrar" color="primary" icon="save" />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from "vue";
import { useRoute } from "vue-router";
import PessoaForm, { novaPessoaForm, pessoaFormParaInput } from "./pessoaForm.vue";
import { ImoveisService, PAPEIS } from "./imoveis.service";

export default defineComponent({
  name: "PessoaIncluir",
  components: { PessoaForm },
  setup() {
    const $route = useRoute();
    const $service = new ImoveisService();
    const papelQuery = String($route.query.papel ?? "");
    const papel = PAPEIS.find((p) => p.value === papelQuery)?.value;
    const form = reactive(novaPessoaForm(papel));
    const voltar = computed(() =>
      papel === "inquilino" ? "imoveis.inquilinos" : "imoveis.proprietarios",
    );

    async function salvar() {
      await $service.incluirPessoa(pessoaFormParaInput(form));
    }

    return { form, salvar, voltar };
  },
});
</script>
