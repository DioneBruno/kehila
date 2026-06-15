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
        :to="{ name: 'financeiro.contas-bancarias' }"
        class="q-mr-sm"
      />
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ conta?.nome || "Carregando..." }}
        </p>
        <q-badge
          v-if="conta"
          :color="statusCor(conta.status)"
          :label="statusLabel(conta.status)"
          class="q-mt-xs"
        />
      </div>
      <div v-if="conta" class="col-auto">
        <q-btn unelevated color="negative" label="Excluir" icon="delete" @click="excluir" />
      </div>
    </div>

    <div v-if="conta" class="row q-col-gutter-md">
      <!-- Formulário -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <p class="text-subtitle1 text-weight-bold q-ma-none">Dados da Conta</p>
              <div>
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
                    label="Salvar"
                    color="primary"
                    icon="save"
                    @click="salvar"
                  />
                </div>
              </div>
            </div>

            <q-form greedy>
              <div class="row q-col-gutter-md">
                <!-- Identificação -->
                <div class="col-12">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">
                    Identificação
                  </p>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.nome"
                    label="Nome da Conta"
                    filled
                    :readonly="!editando"
                    :rules="[(v) => !!v || 'Obrigatório']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-select
                    v-model="form.status"
                    label="Status"
                    filled
                    emit-value
                    map-options
                    :options="opcoesStatus"
                    :readonly="!editando"
                    :disable="!editando"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-select
                    v-model="form.ambiente"
                    label="Ambiente"
                    filled
                    emit-value
                    map-options
                    :options="[
                      { label: 'Homologação', value: 'HOMOLOG' },
                      { label: 'Produção', value: 'PROD' },
                    ]"
                    :readonly="!editando"
                    :disable="!editando"
                  />
                </div>

                <!-- Dados Bancários -->
                <div class="col-12 q-mt-sm">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">
                    Dados Bancários
                  </p>
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.bancoNumero"
                    label="Número do Banco"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="form.agencia" label="Agência" filled :readonly="!editando" />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="form.conta" label="Conta" filled :readonly="!editando" />
                </div>
                <div class="col-12 col-sm-1">
                  <q-input v-model="form.digito" label="Dígito" filled :readonly="!editando" />
                </div>

                <!-- Integração -->
                <div class="col-12 q-mt-sm">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">
                    Integração
                  </p>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.chaveApi"
                    label="Chave de API"
                    filled
                    type="textarea"
                    autogrow
                    :readonly="!editando"
                  />
                </div>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Painel lateral -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Informações</p>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="calendar_today" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Criado em</q-item-label>
                  <q-item-label>{{ formatarData(conta.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="update" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Atualizado em</q-item-label>
                  <q-item-label>{{ formatarData(conta.updatedAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="conta.bancoNumero">
                <q-item-section avatar>
                  <q-icon name="account_balance" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Banco</q-item-label>
                  <q-item-label>{{ conta.bancoNumero }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="conta.agencia">
                <q-item-section avatar>
                  <q-icon name="tag" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Agência / Conta</q-item-label>
                  <q-item-label>
                    {{ conta.agencia }} / {{ conta.conta }}
                    <span v-if="conta.digito">-{{ conta.digito }}</span>
                  </q-item-label>
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
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import { useRoute } from "vue-router";
import { ContaBancariaService, STATUS_CORES, STATUS_LABELS } from "./contaBancaria.service";

const OPCOES_STATUS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default defineComponent({
  name: "FinanceiroContasBancariasEditar",
  setup() {
    const $route = useRoute();
    const $service = new ContaBancariaService();

    const data = reactive({
      conta: null as any,
      editando: false,
      opcoesStatus: OPCOES_STATUS,
      form: {
        nome: "",
        bancoNumero: "",
        agencia: "",
        conta: "",
        digito: "",
        chaveApi: "",
        ambiente: "HOMOLOG",
        status: "ativo",
      },
    });

    function carregarForm(conta: any) {
      data.form.nome = conta.nome ?? "";
      data.form.bancoNumero = conta.bancoNumero ?? "";
      data.form.agencia = conta.agencia ?? "";
      data.form.conta = conta.conta ?? "";
      data.form.digito = conta.digito ?? "";
      data.form.chaveApi = conta.chaveApi ?? "";
      data.form.status = conta.status ?? "ativo";
      data.form.ambiente = conta.ambiente ?? "HOMOLOG";
    }

    async function carregar() {
      const uuid = $route.params.uuid as string;
      const conta = await $service.buscarPorUuid(uuid);
      if (conta) {
        data.conta = conta;
        carregarForm(conta);
      }
    }

    async function salvar() {
      const uuid = $route.params.uuid as string;
      const ok = await $service.editar(uuid, {
        nome: data.form.nome,
        bancoNumero: data.form.bancoNumero || undefined,
        agencia: data.form.agencia || undefined,
        conta: data.form.conta || undefined,
        digito: data.form.digito || undefined,
        chaveApi: data.form.chaveApi || undefined,
        status: data.form.status,
        ambiente: data.form.ambiente,
      });
      if (ok) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      if (data.conta) carregarForm(data.conta);
    }

    async function excluir() {
      const uuid = $route.params.uuid as string;
      await $service.deletar(uuid);
    }

    function statusLabel(status: string) {
      return STATUS_LABELS[status] ?? status;
    }

    function statusCor(status: string) {
      return STATUS_CORES[status] ?? "grey";
    }

    function formatarData(iso: string) {
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
      salvar,
      cancelarEdicao,
      excluir,
      statusLabel,
      statusCor,
      formatarData,
    };
  },
});
</script>
