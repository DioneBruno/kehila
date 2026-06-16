<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ empresa?.name || "Carregando..." }}
        </p>
        <p class="text-caption text-grey-6 q-ma-none">Dados da sua empresa</p>
      </div>
      <div v-if="empresa" class="col-auto">
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
          <q-btn unelevated dense label="Salvar" color="primary" icon="save" @click="salvar" />
        </div>
      </div>
    </div>

    <div v-if="empresa" class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <q-form ref="formRef" greedy>
              <div class="row q-col-gutter-md">
                <!-- Identificação -->
                <div class="col-12">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">
                    Identificação
                  </p>
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.cpfCnpj"
                    label="CPF/CNPJ"
                    filled
                    :readonly="!editando"
                    :rules="[(v) => !!v || 'Obrigatório']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.stateRegistration"
                    label="Inscrição Estadual"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.name"
                    label="Razão Social"
                    filled
                    :readonly="!editando"
                    :rules="[(v) => !!v || 'Obrigatório']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.commercialName"
                    label="Nome Comercial"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.fantasyName"
                    label="Nome Fantasia"
                    filled
                    :readonly="!editando"
                  />
                </div>

                <!-- Contato -->
                <div class="col-12 q-mt-sm">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">Contato</p>
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.email"
                    label="E-mail"
                    type="email"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.phone"
                    label="Telefone"
                    filled
                    unmasked-value
                    fill-mask
                    mask="(##) #####-####"
                    :readonly="!editando"
                  />
                </div>

                <!-- Endereço -->
                <div class="col-12 q-mt-sm">
                  <p class="text-caption text-grey-6 q-ma-none q-mb-sm text-uppercase">Endereço</p>
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.address.cep"
                    label="CEP"
                    filled
                    unmasked-value
                    fill-mask
                    mask="#####-###"
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-7">
                  <q-input
                    v-model="form.address.logradouro"
                    label="Logradouro"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="form.address.numero"
                    label="Número"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.address.complemento"
                    label="Complemento"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.address.bairro"
                    label="Bairro"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.address.cidade"
                    label="Cidade"
                    filled
                    :readonly="!editando"
                  />
                </div>
                <div class="col-12 col-sm-1">
                  <q-select
                    v-model="form.uf"
                    label="UF"
                    filled
                    :options="opcoesUf"
                    :readonly="!editando"
                    :disable="!editando"
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
                  <q-item-label>{{ formatarData(empresa.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="update" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Atualizado em</q-item-label>
                  <q-item-label>{{ formatarData(empresa.updatedAt) }}</q-item-label>
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
import { EmpresaService } from "./empresa.service";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default defineComponent({
  name: "EmpresaEditar",
  setup() {
    const $service = new EmpresaService();

    const data = reactive({
      empresa: null as any,
      editando: false,
      opcoesUf: UFS,
      form: {
        name: "",
        commercialName: "",
        fantasyName: "",
        stateRegistration: "",
        cpfCnpj: "",
        email: "",
        phone: "",
        uf: "",
        address: {
          cep: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
        },
      },
    });

    function carregarForm(empresa: any) {
      data.form.name = empresa.name ?? "";
      data.form.commercialName = empresa.commercialName ?? "";
      data.form.fantasyName = empresa.fantasyName ?? "";
      data.form.stateRegistration = empresa.stateRegistration ?? "";
      data.form.cpfCnpj = empresa.cpfCnpj ?? "";
      data.form.email = empresa.email ?? "";
      data.form.phone = empresa.phone ?? "";
      data.form.uf = empresa.uf ?? "";
      data.form.address = {
        cep: empresa.address?.cep ?? "",
        logradouro: empresa.address?.logradouro ?? "",
        numero: empresa.address?.numero ?? "",
        complemento: empresa.address?.complemento ?? "",
        bairro: empresa.address?.bairro ?? "",
        cidade: empresa.address?.cidade ?? "",
      };
    }

    async function carregar() {
      const empresa = await $service.buscar();
      if (empresa) {
        data.empresa = empresa;
        carregarForm(empresa);
      }
    }

    async function salvar() {
      const ok = await $service.editar({
        name: data.form.name,
        commercialName: data.form.commercialName || undefined,
        fantasyName: data.form.fantasyName || undefined,
        stateRegistration: data.form.stateRegistration || undefined,
        cpfCnpj: data.form.cpfCnpj,
        email: data.form.email || undefined,
        phone: data.form.phone || undefined,
        uf: data.form.uf || undefined,
        address: data.form.address,
      });
      if (ok) {
        data.editando = false;
        await carregar();
      }
    }

    function cancelarEdicao() {
      data.editando = false;
      if (data.empresa) carregarForm(data.empresa);
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
      formatarData,
    };
  },
});
</script>
