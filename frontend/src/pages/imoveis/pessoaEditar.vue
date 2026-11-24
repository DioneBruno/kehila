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
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ pessoa?.nome || (pessoa ? "Sem nome" : "Carregando...") }}
        </p>
        <div v-if="pessoa" class="q-mt-xs">
          <q-badge color="grey-7" :label="labelTipo" class="q-mr-xs" />
          <q-badge
            v-if="pessoa.ehProprietario"
            color="primary"
            label="Proprietário"
            class="q-mr-xs"
          />
          <q-badge v-if="pessoa.ehInquilino" color="blue-6" label="Inquilino" class="q-mr-xs" />
          <q-badge v-if="pessoa.ehFiador" color="orange-8" label="Fiador" />
        </div>
      </div>
      <div v-if="pessoa" class="col-auto">
        <q-btn unelevated color="negative" label="Excluir" icon="delete" @click="excluir" />
      </div>
    </div>

    <div v-if="naoEncontrado" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="person_off" size="48px" />
      <p class="q-mt-md">Pessoa não encontrada.</p>
      <q-btn flat color="primary" label="Voltar para a lista" :to="{ name: voltar }" />
    </div>

    <q-form v-if="pessoa" ref="formRef" greedy @submit.prevent="salvar">
      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <p class="text-subtitle1 text-weight-bold q-ma-none">Dados cadastrais</p>
            <q-btn
              v-if="!editando"
              flat
              dense
              icon="edit"
              label="Editar"
              color="primary"
              @click="editando = true"
            />
            <div v-else class="row q-gutter-sm">
              <q-btn flat dense label="Cancelar" color="grey-7" @click="cancelarEdicao" />
              <q-btn unelevated dense type="submit" label="Salvar" color="primary" icon="save" />
            </div>
          </div>
          <pessoa-form :form="form" :readonly="!editando" tipo-fixo />
        </q-card-section>
      </q-card>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watch } from "vue";
import { useRoute } from "vue-router";
import type { Pessoa, PessoaInput } from "src/@modules/imoveis/pessoa.http";
import PessoaForm, { novaPessoaForm, pessoaFormParaInput } from "./pessoaForm.vue";
import { ImoveisService, labelPessoaTipo } from "./imoveis.service";

export default defineComponent({
  name: "PessoaEditar",
  components: { PessoaForm },
  setup() {
    const $route = useRoute();
    const $service = new ImoveisService();
    const uuid = computed(() => $route.params.uuid as string);

    const data = reactive({
      pessoa: null as Pessoa | null,
      naoEncontrado: false,
      editando: false,
    });
    const form = reactive(novaPessoaForm());
    const formRef = ref();

    const voltar = computed(() =>
      data.pessoa?.ehInquilino && !data.pessoa.ehProprietario
        ? "imoveis.inquilinos"
        : "imoveis.proprietarios",
    );
    const labelTipo = computed(() => (data.pessoa ? labelPessoaTipo(data.pessoa.tipo) : ""));

    async function carregar() {
      const pessoa = await $service.buscarPessoa(uuid.value);
      data.pessoa = pessoa;
      data.naoEncontrado = !pessoa;
      Object.assign(form, novaPessoaForm(null, pessoa));
    }

    async function salvar() {
      // O tipo (PF/PJ) não é alterável no backend.
      const input: Partial<PessoaInput> = pessoaFormParaInput(form);
      delete input.tipo;
      if (await $service.alterarPessoa(uuid.value, input)) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      Object.assign(form, novaPessoaForm(null, data.pessoa));
      formRef.value?.resetValidation();
    }

    async function excluir() {
      await $service.deletarPessoa(uuid.value, voltar.value);
    }

    watch(uuid, (novo) => {
      if (!novo) return;
      data.editando = false;
      void carregar();
    });
    onMounted(() => void carregar());

    return { ...toRefs(data), form, formRef, voltar, labelTipo, salvar, cancelarEdicao, excluir };
  },
});
</script>
