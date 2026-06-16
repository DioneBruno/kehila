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

      <!-- Domínios -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <p class="text-subtitle1 text-weight-bold q-ma-none">Domínios</p>
              <q-btn
                unelevated
                dense
                color="primary"
                icon="add"
                label="Adicionar Domínio"
                @click="abrirDialogDominio()"
              />
            </div>

            <div v-if="dominios.length === 0" class="text-center text-grey-5 q-py-md">
              <q-icon name="dns" size="32px" color="grey-4" />
              <p class="text-caption q-mt-sm q-mb-0">Nenhum domínio cadastrado</p>
            </div>

            <q-list v-else separator>
              <q-item v-for="dominio in dominios" :key="dominio.uuid">
                <q-item-section>
                  <q-item-label>{{ dominio.domain }}</q-item-label>
                  <q-item-label caption>Criado em {{ formatarData(dominio.createdAt) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="dominio.active ? 'positive' : 'grey-6'"
                    :label="dominio.active ? 'Ativo' : 'Inativo'"
                  />
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      round
                      icon="edit"
                      color="primary"
                      @click="abrirDialogDominio(dominio)"
                    >
                      <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      icon="delete"
                      color="negative"
                      @click="removerDominio(dominio.uuid)"
                    >
                      <q-tooltip>Remover</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog: Criar/Editar Domínio -->
    <q-dialog v-model="dialogDominio.aberto" persistent>
      <q-card style="min-width: 360px; max-width: 480px; width: 100%">
        <q-card-section class="row items-center">
          <span class="text-h6">{{ dialogDominio.editando ? "Editar Domínio" : "Novo Domínio" }}</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="salvarDominio" greedy>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="dialogDominio.form.domain"
                  label="Domínio *"
                  filled
                  :rules="[(v) => !!v || 'Obrigatório']"
                  lazy-rules
                  hint="Ex: minhaempresa.com.br"
                />
              </div>
              <div class="col-12">
                <q-toggle v-model="dialogDominio.form.active" label="Domínio ativo" color="positive" />
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
import { EmpresaService } from "./empresa.service";
import { DominioService } from "./dominio.service";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const dominioFormVazio = () => ({ domain: "", active: true });

export default defineComponent({
  name: "EmpresaEditar",
  setup() {
    const $service = new EmpresaService();
    const $dominioService = new DominioService();

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
      dominios: [] as any[],
      dialogDominio: {
        aberto: false,
        editando: false,
        uuid: "",
        form: dominioFormVazio(),
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

    async function carregarDominios() {
      data.dominios = await $dominioService.listar();
    }

    function abrirDialogDominio(dominio?: any) {
      if (dominio) {
        data.dialogDominio.editando = true;
        data.dialogDominio.uuid = dominio.uuid;
        data.dialogDominio.form = { domain: dominio.domain ?? "", active: !!dominio.active };
      } else {
        data.dialogDominio.editando = false;
        data.dialogDominio.uuid = "";
        data.dialogDominio.form = dominioFormVazio();
      }
      data.dialogDominio.aberto = true;
    }

    async function salvarDominio() {
      const form = data.dialogDominio.form;
      let ok: boolean;
      if (data.dialogDominio.editando) {
        ok = await $dominioService.editar(data.dialogDominio.uuid, {
          domain: form.domain,
          active: form.active,
        });
      } else {
        ok = await $dominioService.criar({ domain: form.domain, active: form.active });
      }
      if (ok) {
        data.dialogDominio.aberto = false;
        await carregarDominios();
      }
    }

    async function removerDominio(uuid: string) {
      const ok = await $dominioService.deletar(uuid);
      if (ok) await carregarDominios();
    }

    onMounted(() => {
      void carregar();
      void carregarDominios();
    });

    return {
      ...toRefs(data),
      salvar,
      cancelarEdicao,
      formatarData,
      abrirDialogDominio,
      salvarDominio,
      removerDominio,
    };
  },
});
</script>
