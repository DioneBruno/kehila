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
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ contrato ? titulo : "Carregando..." }}
        </p>
        <div v-if="contrato" class="q-mt-xs">
          <q-badge
            :color="corStatus(contrato.status)"
            :label="labelStatus(contrato.status)"
            class="q-mr-xs"
          />
          <span class="text-caption text-grey-7">{{ contrato.inquilinoNome }}</span>
        </div>
      </div>
      <div v-if="contrato && vigente" class="col-auto row q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="autorenew"
          label="Renovar"
          @click="abrir('renovacao')"
        />
        <q-btn
          unelevated
          no-caps
          color="blue-6"
          icon="edit_note"
          label="Aditivo"
          @click="abrir('aditivo')"
        />
        <q-btn
          outline
          no-caps
          color="grey-8"
          icon="event_busy"
          label="Encerrar"
          @click="abrir('encerramento')"
        />
        <q-btn
          outline
          no-caps
          color="negative"
          icon="gavel"
          label="Rescindir"
          @click="abrir('rescisao')"
        />
      </div>
    </div>

    <div v-if="naoEncontrado" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="description" size="48px" />
      <p class="q-mt-md">Contrato não encontrado.</p>
      <q-btn flat color="primary" label="Voltar para a lista" :to="{ name: 'imoveis.contratos' }" />
    </div>

    <div v-if="contrato" class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-form ref="formRef" greedy @submit.prevent="salvar">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <p class="text-subtitle1 text-weight-bold q-ma-none">Dados vigentes</p>
                <template v-if="vigente">
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
                </template>
              </div>
              <contrato-form :form="form" :readonly="!editando" edicao />
            </q-card-section>
          </q-card>
        </q-form>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Resumo</p>
            <q-list dense>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Imóvel</q-item-label>
                  <q-item-label>
                    <router-link
                      class="text-primary"
                      :to="{
                        name: 'imoveis.imoveis.detalhe',
                        params: { uuid: contrato.imovelUuid },
                      }"
                    >
                      {{ contrato.imovelIdentificacao }}
                    </router-link>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Proprietário</q-item-label>
                  <q-item-label>{{ contrato.proprietarioNome }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Aluguel</q-item-label>
                  <q-item-label>{{ formatarMoeda(contrato.valorAluguel) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Período</q-item-label>
                  <q-item-label>
                    {{ formatarData(contrato.inicio) }} a {{ formatarData(contrato.fim) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="contrato.encerradoEm">
                <q-item-section>
                  <q-item-label caption>Encerrado em</q-item-label>
                  <q-item-label>{{ formatarData(contrato.encerradoEm) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Histórico</p>
            <p v-if="!eventos.length" class="text-grey-6 q-ma-none">Nenhum evento registrado.</p>
            <q-list v-else separator>
              <q-item v-for="e in eventos" :key="e.uuid">
                <q-item-section>
                  <q-item-label>
                    <q-badge
                      :color="corEvento(e.tipo)"
                      :label="labelEvento(e.tipo)"
                      class="q-mr-sm"
                    />
                    {{ formatarData(e.data) }}
                  </q-item-label>
                  <q-item-label class="q-mt-xs">{{ e.descricao }}</q-item-label>
                  <q-item-label v-if="e.fimNovo" caption>
                    Fim: {{ formatarData(e.fimAnterior) }} → {{ formatarData(e.fimNovo) }}
                  </q-item-label>
                  <q-item-label v-if="e.valorNovo !== null" caption>
                    Aluguel: {{ formatarMoeda(e.valorAnterior) }} → {{ formatarMoeda(e.valorNovo) }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ e.criadoPorNome || "Sistema" }} · {{ formatarDataHora(e.createdAt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <contrato-evento-dialog
      v-if="contrato"
      v-model="dialogo"
      :tipo="tipoEvento"
      :contrato="contrato"
      @salvo="carregar"
    />
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watch } from "vue";
import { useRoute } from "vue-router";
import type {
  Contrato,
  ContratoEvento,
  ContratoEventoTipo,
} from "src/@modules/imoveis/contrato.http";
import ContratoEventoDialog from "./contratoEventoDialog.vue";
import ContratoForm, { contratoFormParaEdicao, novoContratoForm } from "./contratoForm.vue";
import {
  ImoveisService,
  corEvento,
  corStatus,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  labelEvento,
  labelStatus,
} from "./imoveis.service";

export default defineComponent({
  name: "ContratoDetalhe",
  components: { ContratoForm, ContratoEventoDialog },
  setup() {
    const $route = useRoute();
    const $service = new ImoveisService();
    const uuid = computed(() => $route.params.uuid as string);

    const data = reactive({
      contrato: null as Contrato | null,
      eventos: [] as ContratoEvento[],
      naoEncontrado: false,
      editando: false,
      dialogo: false,
      tipoEvento: "renovacao" as ContratoEventoTipo,
    });
    const form = reactive(novoContratoForm());
    const formRef = ref();

    const vigente = computed(() => data.contrato?.status === "vigente");
    const titulo = computed(() =>
      data.contrato?.numero
        ? `Contrato ${data.contrato.numero} - ${data.contrato.imovelIdentificacao}`
        : `Contrato - ${data.contrato?.imovelIdentificacao ?? ""}`,
    );

    /** Recarrega o contrato e o histórico (também depois de cada evento). */
    async function carregar() {
      const contrato = await $service.buscarContrato(uuid.value);
      data.contrato = contrato;
      data.naoEncontrado = !contrato;
      Object.assign(form, novoContratoForm(contrato));
      data.eventos = contrato ? ((await $service.listarEventosContrato(uuid.value)) ?? []) : [];
    }

    async function salvar() {
      if (await $service.alterarContrato(uuid.value, contratoFormParaEdicao(form))) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      Object.assign(form, novoContratoForm(data.contrato));
      formRef.value?.resetValidation();
    }

    function abrir(tipo: ContratoEventoTipo) {
      data.tipoEvento = tipo;
      data.dialogo = true;
    }

    watch(uuid, (novo) => {
      if (!novo) return;
      data.editando = false;
      void carregar();
    });
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      form,
      formRef,
      vigente,
      titulo,
      carregar,
      salvar,
      cancelarEdicao,
      abrir,
      corStatus,
      labelStatus,
      corEvento,
      labelEvento,
      formatarData,
      formatarDataHora,
      formatarMoeda,
    };
  },
});
</script>
