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
        :to="{ name: 'eventos.detalhe', params: { uuid: eventoUuid } }"
        class="q-mr-sm"
      />
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Lotes e Ingressos</p>
        <p class="text-caption text-grey-6 q-ma-none">
          Gerencie os lotes e tipos de ingresso do evento
        </p>
      </div>
      <q-btn unelevated color="primary" icon="add" label="Novo Lote" @click="abrirDialogLote()" />
    </div>

    <!-- Lista de lotes -->
    <div v-if="lotes.length === 0" class="text-center q-py-xl">
      <q-icon name="confirmation_number" size="64px" color="grey-4" />
      <p class="text-subtitle1 text-grey-5 q-mt-md q-mb-sm">Nenhum lote criado ainda</p>
      <p class="text-caption text-grey-4 q-mb-lg">
        Crie um lote para definir preços e disponibilidade de ingressos
      </p>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Criar Primeiro Lote"
        @click="abrirDialogLote()"
      />
    </div>

    <div v-else class="q-gutter-md">
      <q-card v-for="lote in lotes" :key="lote.uuid" flat bordered>
        <!-- Cabeçalho do lote -->
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="row items-center q-gutter-sm">
                <span class="text-subtitle1 text-weight-bold">{{ lote.nome }}</span>
                <q-badge
                  :color="lote.ativo ? 'positive' : 'grey'"
                  :label="lote.ativo ? 'Ativo' : 'Inativo'"
                />
                <q-badge color="blue-grey" :label="`Ordem ${lote.ordem}`" />
              </div>
              <div class="row q-gutter-x-md q-mt-xs text-caption text-grey-6">
                <span>
                  <q-icon name="confirmation_number" size="14px" class="q-mr-xs" />
                  {{ lote.quantidade }} vagas · {{ formatarMoeda(lote.preco) }}
                </span>
                <span v-if="lote.dataInicio">
                  <q-icon name="event" size="14px" class="q-mr-xs" />
                  {{ formatarData(lote.dataInicio) }}
                  <span v-if="lote.dataFim"> até {{ formatarData(lote.dataFim) }}</span>
                </span>
              </div>
            </div>
            <div class="col-auto row q-gutter-xs">
              <q-btn flat dense round icon="edit" color="primary" @click="abrirDialogLote(lote)">
                <q-tooltip>Editar lote</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="removerLote(lote.uuid)"
              >
                <q-tooltip>Remover lote</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Tipos de ingresso -->
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <span class="text-caption text-grey-7 text-weight-medium text-uppercase">
              Tipos de Ingresso
            </span>
            <q-btn
              flat
              dense
              size="sm"
              icon="add"
              label="Adicionar"
              color="primary"
              @click="abrirDialogTipo(lote.uuid)"
            />
          </div>

          <div v-if="lote.tiposIngresso.length === 0" class="text-center text-grey-5 q-py-sm">
            <q-icon name="info" size="sm" class="q-mr-xs" />
            <span class="text-caption">Nenhum tipo de ingresso neste lote</span>
          </div>

          <q-list v-else separator dense class="rounded-borders">
            <q-item v-for="tipo in lote.tiposIngresso" :key="tipo.uuid" class="q-px-sm">
              <q-item-section>
                <q-item-label class="row items-center q-gutter-xs">
                  <span>{{ tipo.nome }}</span>
                  <q-badge v-if="!tipo.visivel" color="grey" label="Oculto" dense />
                </q-item-label>
                <q-item-label caption>
                  {{ formatarMoeda(tipo.preco) }}
                  · {{ tipo.vendidos }}/{{ tipo.quantidade }} vendidos ·
                  {{ tipo.disponivel }} disponíveis
                  <span v-if="tipo.descricao"> · {{ tipo.descricao }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="edit"
                    color="primary"
                    @click="abrirDialogTipo(lote.uuid, tipo)"
                  >
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="delete"
                    color="negative"
                    :disable="tipo.vendidos > 0"
                    @click="removerTipo(lote.uuid, tipo.uuid)"
                  >
                    <q-tooltip>{{
                      tipo.vendidos > 0 ? "Possui ingressos vendidos" : "Remover"
                    }}</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <!-- Dialog: Criar/Editar Lote -->
    <q-dialog v-model="dialogLote.aberto" persistent>
      <q-card style="min-width: 400px; max-width: 560px; width: 100%">
        <q-card-section class="row items-center">
          <span class="text-h6">{{ dialogLote.editando ? "Editar Lote" : "Novo Lote" }}</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="salvarLote" greedy>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-8">
                <q-input
                  v-model="dialogLote.form.nome"
                  label="Nome do Lote *"
                  filled
                  :rules="[(v) => !!v || 'Obrigatório']"
                  lazy-rules
                  hint="Ex: 1º Lote, VIP, Meia-entrada"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="dialogLote.form.ordem"
                  label="Ordem *"
                  filled
                  type="number"
                  min="1"
                  :rules="[(v) => v > 0 || 'Obrigatório']"
                  lazy-rules
                  hint="Prioridade de ativação"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="dialogLote.form.quantidade"
                  label="Quantidade *"
                  filled
                  type="number"
                  min="1"
                  :rules="[(v) => v > 0 || 'Obrigatório']"
                  lazy-rules
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="dialogLote.form.preco"
                  label="Preço (R$) *"
                  filled
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[(v) => v >= 0 || 'Obrigatório']"
                  lazy-rules
                  prefix="R$"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="dialogLote.form.dataInicio"
                  label="Início das vendas"
                  filled
                  readonly
                  clearable
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover>
                        <q-date
                          v-model="dialogLote.form.dataInicio"
                          mask="YYYY-MM-DDTHH:mm"
                          color="primary"
                        >
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="OK" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="dialogLote.form.dataFim"
                  label="Fim das vendas"
                  filled
                  readonly
                  clearable
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover>
                        <q-date
                          v-model="dialogLote.form.dataFim"
                          mask="YYYY-MM-DDTHH:mm"
                          color="primary"
                        >
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="OK" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-toggle v-model="dialogLote.form.ativo" label="Lote ativo" color="positive" />
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
              <q-btn unelevated type="submit" label="Salvar" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog: Criar/Editar Tipo de Ingresso -->
    <q-dialog v-model="dialogTipo.aberto" persistent>
      <q-card style="min-width: 400px; max-width: 520px; width: 100%">
        <q-card-section class="row items-center">
          <span class="text-h6">{{
            dialogTipo.editando ? "Editar Tipo de Ingresso" : "Novo Tipo de Ingresso"
          }}</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="salvarTipo" greedy>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="dialogTipo.form.nome"
                  label="Nome *"
                  filled
                  :rules="[(v) => !!v || 'Obrigatório']"
                  lazy-rules
                  hint="Ex: Inteira, Meia-entrada, VIP, Cortesia"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="dialogTipo.form.descricao"
                  label="Descrição"
                  filled
                  type="textarea"
                  autogrow
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="dialogTipo.form.quantidade"
                  label="Quantidade *"
                  filled
                  type="number"
                  min="1"
                  :rules="[(v) => v > 0 || 'Obrigatório']"
                  lazy-rules
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="dialogTipo.form.preco"
                  label="Preço (R$) *"
                  filled
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[(v) => v >= 0 || 'Obrigatório']"
                  lazy-rules
                  prefix="R$"
                />
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="dialogTipo.form.visivel"
                  label="Visível para o público"
                  color="positive"
                />
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
              <q-btn unelevated type="submit" label="Salvar" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRoute } from "vue-router";
import { LotesService } from "./lotes.service";

const loteFormVazio = () => ({
  nome: "",
  ordem: 1,
  quantidade: 0,
  preco: 0,
  dataInicio: "",
  dataFim: "",
  ativo: true,
});

const tipoFormVazio = () => ({
  nome: "",
  descricao: "",
  quantidade: 0,
  preco: 0,
  visivel: true,
});

export default defineComponent({
  name: "PortalEventosLotes",
  setup() {
    const $route = useRoute();
    const $service = new LotesService();
    const eventoUuid = $route.params.uuid as string;

    const data = reactive({
      lotes: [] as any[],
      dialogLote: {
        aberto: false,
        editando: false,
        uuid: "",
        form: loteFormVazio(),
      },
      dialogTipo: {
        aberto: false,
        editando: false,
        loteUuid: "",
        uuid: "",
        form: tipoFormVazio(),
      },
    });

    async function carregar() {
      data.lotes = await $service.listar(eventoUuid);
    }

    function abrirDialogLote(lote?: any) {
      if (lote) {
        data.dialogLote.editando = true;
        data.dialogLote.uuid = lote.uuid;
        data.dialogLote.form = {
          nome: lote.nome,
          ordem: lote.ordem,
          quantidade: lote.quantidade,
          preco: lote.preco,
          dataInicio: lote.dataInicio ? lote.dataInicio.slice(0, 16) : "",
          dataFim: lote.dataFim ? lote.dataFim.slice(0, 16) : "",
          ativo: lote.ativo,
        };
      } else {
        const proximaOrdem =
          data.lotes.length > 0 ? Math.max(...data.lotes.map((l) => l.ordem)) + 1 : 1;
        data.dialogLote.editando = false;
        data.dialogLote.uuid = "";
        data.dialogLote.form = { ...loteFormVazio(), ordem: proximaOrdem };
      }
      data.dialogLote.aberto = true;
    }

    async function salvarLote() {
      const form = data.dialogLote.form;
      const payload = {
        eventoUuid,
        nome: form.nome,
        ordem: form.ordem,
        quantidade: form.quantidade,
        preco: form.preco,
        dataInicio: form.dataInicio || undefined,
        dataFim: form.dataFim || undefined,
        ativo: form.ativo,
      };

      let ok: boolean;
      if (data.dialogLote.editando) {
        ok = await $service.editar(data.dialogLote.uuid, payload);
      } else {
        ok = await $service.criar(payload);
      }

      if (ok) {
        data.dialogLote.aberto = false;
        await carregar();
      }
    }

    async function removerLote(loteUuid: string) {
      const ok = await $service.remover(loteUuid);
      if (ok) await carregar();
    }

    function abrirDialogTipo(loteUuid: string, tipo?: any) {
      data.dialogTipo.loteUuid = loteUuid;
      if (tipo) {
        data.dialogTipo.editando = true;
        data.dialogTipo.uuid = tipo.uuid;
        data.dialogTipo.form = {
          nome: tipo.nome,
          descricao: tipo.descricao ?? "",
          quantidade: tipo.quantidade,
          preco: tipo.preco,
          visivel: tipo.visivel,
        };
      } else {
        data.dialogTipo.editando = false;
        data.dialogTipo.uuid = "";
        data.dialogTipo.form = tipoFormVazio();
      }
      data.dialogTipo.aberto = true;
    }

    async function salvarTipo() {
      const form = data.dialogTipo.form;
      const payload = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        quantidade: form.quantidade,
        preco: form.preco,
        visivel: form.visivel,
      };

      let ok: boolean;
      if (data.dialogTipo.editando) {
        ok = await $service.editarTipo(data.dialogTipo.loteUuid, data.dialogTipo.uuid, payload);
      } else {
        ok = await $service.criarTipo(data.dialogTipo.loteUuid, payload);
      }

      if (ok) {
        data.dialogTipo.aberto = false;
        await carregar();
      }
    }

    async function removerTipo(loteUuid: string, tipoUuid: string) {
      const ok = await $service.removerTipo(loteUuid, tipoUuid);
      if (ok) await carregar();
    }

    function formatarMoeda(valor: number) {
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function formatarData(iso: string) {
      if (!iso) return "";
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
      eventoUuid,
      abrirDialogLote,
      salvarLote,
      removerLote,
      abrirDialogTipo,
      salvarTipo,
      removerTipo,
      formatarMoeda,
      formatarData,
    };
  },
});
</script>
