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
      <div>
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Nova Conta Bancária</p>
        <p class="text-caption text-grey-6 q-ma-none">Preencha os dados da conta bancária</p>
      </div>
    </div>

    <q-form @submit.prevent="salvar" greedy>
      <div class="row q-col-gutter-md">
        <!-- Identificação -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Identificação</p>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.nome"
                    label="Nome da Conta *"
                    filled
                    :rules="[(v) => !!v || 'O nome é obrigatório']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.status"
                    label="Status"
                    filled
                    emit-value
                    map-options
                    :options="opcoesStatus"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Dados Bancários -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Dados Bancários</p>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.bancoNumero"
                    label="Número do Banco"
                    filled
                    hint="Ex: 001, 033, 341"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="form.agencia" label="Agência" filled />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="form.conta" label="Conta" filled />
                </div>
                <div class="col-12 col-sm-1">
                  <q-input v-model="form.digito" label="Dígito" filled />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Integração -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-md">Integração</p>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="form.chaveApi"
                    label="Chave de API"
                    filled
                    type="textarea"
                    autogrow
                    hint="Chave de integração com o gateway de pagamento"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Ações -->
        <div class="col-12">
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'financeiro.contas-bancarias' }" />
            <q-btn unelevated type="submit" label="Criar Conta" color="primary" icon="save" />
          </div>
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import { ContaBancariaService, STATUS_LABELS } from "./contaBancaria.service";

const OPCOES_STATUS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default defineComponent({
  name: "FinanceiroContasBancariasIncluir",
  setup() {
    const $service = new ContaBancariaService();

    const data = reactive({
      opcoesStatus: OPCOES_STATUS,
      form: {
        nome: "",
        bancoNumero: "",
        agencia: "",
        conta: "",
        digito: "",
        chaveApi: "",
        status: "ativo",
      },
    });

    async function salvar() {
      await $service.criar({
        nome: data.form.nome,
        bancoNumero: data.form.bancoNumero || undefined,
        agencia: data.form.agencia || undefined,
        conta: data.form.conta || undefined,
        digito: data.form.digito || undefined,
        chaveApi: data.form.chaveApi || undefined,
        status: data.form.status,
      });
    }

    return {
      ...toRefs(data),
      salvar,
    };
  },
});
</script>
