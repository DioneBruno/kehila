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
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ imovel?.identificacao || (imovel ? "Sem identificação" : "Carregando...") }}
        </p>
        <div v-if="imovel" class="q-mt-xs">
          <q-badge
            :color="corSituacao(imovel.situacao)"
            :label="labelSituacao(imovel.situacao)"
            class="q-mr-xs"
          />
          <q-badge color="grey-7" :label="labelImovelTipo(imovel.tipo)" />
        </div>
      </div>
      <div v-if="imovel && ehAdmin" class="col-auto">
        <q-btn unelevated color="negative" label="Excluir" icon="delete" @click="excluir" />
      </div>
    </div>

    <div v-if="naoEncontrado" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="home_work" size="48px" />
      <p class="q-mt-md">Imóvel não encontrado.</p>
      <q-btn flat color="primary" label="Voltar para a lista" :to="{ name: 'imoveis.imoveis' }" />
    </div>

    <div v-if="imovel" class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-form ref="formRef" greedy @submit.prevent="salvar">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <p class="text-subtitle1 text-weight-bold q-ma-none">Dados do imóvel</p>
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
              <imovel-form
                :form="form"
                :readonly="!editando"
                mostrar-situacao
                :situacao-bloqueada="!!imovel.contratoVigente"
              />
            </q-card-section>
          </q-card>
        </q-form>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Contrato vigente</p>
            <template v-if="imovel.contratoVigente">
              <q-list dense>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Inquilino</q-item-label>
                    <q-item-label>{{ imovel.contratoVigente.inquilinoNome }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Aluguel</q-item-label>
                    <q-item-label>{{
                      formatarMoeda(imovel.contratoVigente.valorAluguel)
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Período</q-item-label>
                    <q-item-label>
                      {{ formatarData(imovel.contratoVigente.inicio) }} a
                      {{ formatarData(imovel.contratoVigente.fim) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-btn
                v-if="rotaDetalheContrato"
                flat
                no-caps
                color="primary"
                icon="description"
                label="Ver contrato"
                class="q-mt-sm"
                :to="{
                  name: 'imoveis.contratos.detalhe',
                  params: { uuid: imovel.contratoVigente.uuid },
                }"
              />
            </template>
            <template v-else>
              <p class="text-grey-6 q-mb-sm">Nenhum contrato vigente.</p>
              <q-btn
                v-if="imovel.situacao === 'livre' && rotaCriarContrato"
                unelevated
                no-caps
                color="primary"
                icon="add"
                label="Novo contrato"
                :to="{ name: 'imoveis.contratos.criar', query: { imovel: imovel.uuid } }"
              />
            </template>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Informações</p>
            <q-list dense>
              <q-item>
                <q-item-section avatar
                  ><q-icon name="calendar_today" color="grey-6"
                /></q-item-section>
                <q-item-section>
                  <q-item-label caption>Cadastrado em</q-item-label>
                  <q-item-label>{{ formatarDataHora(imovel.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar><q-icon name="update" color="grey-6" /></q-item-section>
                <q-item-section>
                  <q-item-label caption>Atualizado em</q-item-label>
                  <q-item-label>{{ formatarDataHora(imovel.updatedAt) }}</q-item-label>
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
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watch } from "vue";
import TokenDecode from "src/@modules/auth/tokenDecode";
import { useRoute, useRouter } from "vue-router";
import type { ImovelDetalhe } from "src/@modules/imoveis/imovel.http";
import ImovelForm, { imovelFormParaInput, novoImovelForm } from "./imovelForm.vue";
import {
  ImoveisService,
  corSituacao,
  formatarData,
  formatarMoeda,
  labelImovelTipo,
  labelSituacao,
} from "./imoveis.service";

export default defineComponent({
  name: "ImovelEditar",
  components: { ImovelForm },
  setup() {
    const $route = useRoute();
    const $router = useRouter();
    const $service = new ImoveisService();
    const uuid = computed(() => $route.params.uuid as string);
    // O DELETE do backend é só para admin.
    const ehAdmin = TokenDecode.execute()?.user?.position === "admin";

    const data = reactive({
      imovel: null as ImovelDetalhe | null,
      naoEncontrado: false,
      editando: false,
    });
    const form = reactive(novoImovelForm());
    const formRef = ref();

    // As telas de contrato chegam na Task 9: até lá os links não aparecem.
    const rotaDetalheContrato = computed(() => $router.hasRoute("imoveis.contratos.detalhe"));
    const rotaCriarContrato = computed(() => $router.hasRoute("imoveis.contratos.criar"));

    async function carregar() {
      const imovel = await $service.buscarImovel(uuid.value);
      data.imovel = imovel;
      data.naoEncontrado = !imovel;
      Object.assign(form, novoImovelForm(imovel));
    }

    async function salvar() {
      const input = imovelFormParaInput(form);
      // Só envia a situação quando mudou: alugado/contrato vigente a rejeitam.
      if (input.situacao === data.imovel?.situacao) delete input.situacao;
      if (await $service.alterarImovel(uuid.value, input)) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      Object.assign(form, novoImovelForm(data.imovel));
      formRef.value?.resetValidation();
    }

    async function excluir() {
      await $service.deletarImovel(uuid.value);
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

    watch(uuid, (novo) => {
      if (!novo) return;
      data.editando = false;
      void carregar();
    });
    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      ehAdmin,
      form,
      formRef,
      rotaDetalheContrato,
      rotaCriarContrato,
      salvar,
      cancelarEdicao,
      excluir,
      formatarDataHora,
      corSituacao,
      labelSituacao,
      labelImovelTipo,
      formatarData,
      formatarMoeda,
    };
  },
});
</script>
