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
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ aprisco?.nome || "Carregando..." }}
        </p>
        <div v-if="aprisco" class="q-mt-xs">
          <q-badge
            :color="statusAprisco(aprisco.status).color"
            :label="statusAprisco(aprisco.status).label"
          />
        </div>
      </div>
      <div v-if="aprisco" class="col-auto">
        <q-btn unelevated color="negative" label="Excluir" icon="delete" @click="excluir" />
      </div>
    </div>

    <div v-if="naoEncontrado" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="location_off" size="48px" />
      <p class="q-mt-md">Aprisco não encontrado.</p>
      <q-btn flat color="primary" label="Voltar para a lista" :to="{ name: 'apriscos' }" />
    </div>

    <div v-if="aprisco" class="row q-col-gutter-md">
      <!-- Formulário -->
      <div class="col-12 col-md-8">
        <q-form ref="formRef" greedy @submit.prevent="salvar">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <p class="text-subtitle1 text-weight-bold q-ma-none">Dados do Aprisco</p>
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
                  <q-btn
                    unelevated
                    dense
                    type="submit"
                    label="Salvar"
                    color="primary"
                    icon="save"
                  />
                </div>
              </div>

              <aprisco-form :form="form" :readonly="!editando" />
            </q-card-section>
          </q-card>
        </q-form>

        <aprisco-integrantes :aprisco-uuid="aprisco.uuid" class="q-mt-md" />
      </div>

      <!-- Painel lateral -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Informações</p>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="tag" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Código</q-item-label>
                  <q-item-label>{{ aprisco.index }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="calendar_today" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Cadastrado em</q-item-label>
                  <q-item-label>{{ formatarDataHora(aprisco.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="update" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Atualizado em</q-item-label>
                  <q-item-label>{{ formatarDataHora(aprisco.updatedAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="mapa" clickable tag="a" :href="mapa" target="_blank">
                <q-item-section avatar>
                  <q-icon name="map" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Localização</q-item-label>
                  <q-item-label class="text-primary">Abrir no Google Maps</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs } from "vue";
import { useRoute } from "vue-router";
import type { Aprisco } from "src/@modules/aprisco/aprisco.http";
import ApriscoForm, { apriscoFormParaInput, novoApriscoForm } from "./apriscoForm.vue";
import ApriscoIntegrantes from "./apriscoIntegrantes.vue";
import { ApriscoService, linkMapa, statusAprisco } from "./aprisco.service";

export default defineComponent({
  name: "ApriscoEditar",
  components: { ApriscoForm, ApriscoIntegrantes },
  setup() {
    const $route = useRoute();
    const $service = new ApriscoService();
    const uuid = computed(() => $route.params.uuid as string);

    const data = reactive({
      aprisco: null as Aprisco | null,
      naoEncontrado: false,
      editando: false,
    });
    const form = reactive(novoApriscoForm());
    const formRef = ref();

    const mapa = computed(() => (data.aprisco ? linkMapa(data.aprisco) : null));

    async function carregar() {
      const aprisco = await $service.buscarPorUuid(uuid.value);
      data.aprisco = aprisco;
      data.naoEncontrado = !aprisco;
      Object.assign(form, novoApriscoForm(aprisco));
    }

    async function salvar() {
      const ok = await $service.alterar(uuid.value, apriscoFormParaInput(form));
      if (ok) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      Object.assign(form, novoApriscoForm(data.aprisco));
      formRef.value?.resetValidation();
    }

    async function excluir() {
      await $service.deletar(uuid.value);
    }

    function formatarDataHora(iso: string) {
      if (!iso) return "-";
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      form,
      formRef,
      mapa,
      salvar,
      cancelarEdicao,
      excluir,
      formatarDataHora,
      statusAprisco,
    };
  },
});
</script>
