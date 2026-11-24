<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-7"
        :to="{ name: 'imoveis.contratos' }"
        class="q-mr-sm"
      />
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Novo contrato</p>
        <p class="text-caption text-grey-6 q-ma-none">O imóvel passa a alugado ao salvar</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <q-card flat bordered>
        <q-card-section>
          <contrato-form :form="form" />
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm form-actions q-mt-md">
        <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'imoveis.contratos' }" />
        <q-btn unelevated type="submit" label="Cadastrar contrato" color="primary" icon="save" />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import ContratoForm, { contratoFormParaInclusao, novoContratoForm } from "./contratoForm.vue";
import { ImoveisService } from "./imoveis.service";

export default defineComponent({
  name: "ContratoIncluir",
  components: { ContratoForm },
  setup() {
    const $route = useRoute();
    const $service = new ImoveisService();
    const form = reactive(novoContratoForm());

    // ?imovel= vem do detalhe do imóvel; só pré-seleciona se ele ainda estiver livre.
    onMounted(async () => {
      const imovelUuid = String($route.query.imovel ?? "");
      if (!imovelUuid) return;
      const imovel = await $service.buscarImovel(imovelUuid);
      if (imovel?.situacao === "livre") {
        form.imovelUuid = imovel.uuid;
        form.imovelIdentificacao = imovel.identificacao;
      }
    });

    async function salvar() {
      await $service.incluirContrato(contratoFormParaInclusao(form));
    }

    return { form, salvar };
  },
});
</script>
