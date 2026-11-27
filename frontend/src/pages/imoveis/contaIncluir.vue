<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: 'imoveis.contas' }"
        class="q-mr-sm"
      />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Nova conta</p>
        <p class="text-caption text-grey-6 q-ma-none">Encargo, despesa ou guia de imposto</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <q-card flat bordered>
        <q-card-section>
          <conta-form :form="form" />
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm form-actions q-mt-md">
        <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'imoveis.contas' }" />
        <q-btn
          unelevated
          type="submit"
          :label="form.parcelado ? 'Gerar parcelas' : 'Lançar conta'"
          color="primary"
          icon="save"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import ContaForm, {
  contaFormParaInclusao,
  contaFormParaParcelas,
  novoContaForm,
} from "./contaForm.vue";
import { ImoveisService } from "./imoveis.service";

export default defineComponent({
  name: "ContaIncluir",
  components: { ContaForm },
  setup() {
    const $route = useRoute();
    const $router = useRouter();
    const $service = new ImoveisService();
    const form = reactive(novoContaForm());

    // ?imovelUuid= e ?contratoUuid= vêm do imóvel/contrato (botão "Nova conta").
    // O formulário carrega o imóvel e o proprietário a partir do uuid.
    form.imovelUuid = String($route.query.imovelUuid ?? "");
    form.contratoUuid = String($route.query.contratoUuid ?? "");

    async function salvar() {
      if (form.parcelado) {
        const r = await $service.gerarParcelasConta(contaFormParaParcelas(form));
        if (r) await $router.push({ name: "imoveis.contas" });
        return;
      }
      const r = await $service.incluirConta(contaFormParaInclusao(form));
      if (r) await $router.push({ name: "imoveis.contas.detalhe", params: { uuid: r.uuid } });
    }

    return { form, salvar };
  },
});
</script>
