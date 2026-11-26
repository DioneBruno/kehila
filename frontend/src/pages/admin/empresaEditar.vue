<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">
          {{ empresa?.name || "Carregando..." }}
        </p>
        <p class="text-caption text-grey-6 q-ma-none">Gestão da empresa</p>
      </div>
      <div class="col-auto">
        <q-btn flat color="grey-7" icon="arrow_back" label="Voltar" :to="{ name: 'admin.empresas' }" />
      </div>
    </div>

    <template v-if="empresa">
      <q-tabs v-model="aba" dense align="left" class="text-grey-7" active-color="primary">
        <q-tab name="dados" label="Dados" no-caps />
        <q-tab name="dominios" label="Domínios" no-caps />
        <q-tab name="modulos" label="Módulos" no-caps />
        <q-tab name="usuarios" label="Usuários" no-caps />
      </q-tabs>
      <q-separator class="q-mb-md" />

      <q-tab-panels v-model="aba" animated class="bg-transparent">
        <!-- Dados -->
        <q-tab-panel name="dados" class="q-pa-none">
          <q-card flat bordered>
            <q-card-section>
              <q-form greedy @submit.prevent="salvar">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <q-input
                      v-model="form.cpfCnpj"
                      label="CPF/CNPJ"
                      filled
                      :rules="[(v) => !!v || 'Obrigatório']"
                      lazy-rules
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="form.stateRegistration" label="Inscrição Estadual" filled />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input
                      v-model="form.name"
                      label="Razão Social"
                      filled
                      :rules="[(v) => !!v || 'Obrigatório']"
                      lazy-rules
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="form.commercialName" label="Nome Comercial" filled />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="form.fantasyName" label="Nome Fantasia" filled />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="form.email" label="E-mail" type="email" filled />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.phone"
                      label="Telefone"
                      filled
                      unmasked-value
                      fill-mask
                      mask="(##) #####-####"
                    />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input
                      v-model="form.address.cep"
                      label="CEP"
                      filled
                      unmasked-value
                      fill-mask
                      mask="#####-###"
                    />
                  </div>
                  <div class="col-12 col-sm-7">
                    <q-input v-model="form.address.logradouro" label="Logradouro" filled />
                  </div>
                  <div class="col-12 col-sm-2">
                    <q-input v-model="form.address.numero" label="Número" filled />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="form.address.complemento" label="Complemento" filled />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="form.address.bairro" label="Bairro" filled />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input v-model="form.address.cidade" label="Cidade" filled />
                  </div>
                  <div class="col-12 col-sm-1">
                    <q-select v-model="form.uf" label="UF" filled :options="opcoesUf" />
                  </div>
                </div>
                <div class="row justify-end q-mt-md">
                  <q-btn unelevated type="submit" label="Salvar" color="primary" icon="save" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- Domínios -->
        <q-tab-panel name="dominios" class="q-pa-none">
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
                    <q-item-label caption>
                      Criado em {{ formatarData(dominio.createdAt) }}
                    </q-item-label>
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
        </q-tab-panel>

        <!-- Módulos -->
        <q-tab-panel name="modulos" class="q-pa-none">
          <q-card flat bordered>
            <q-card-section>
              <p class="text-subtitle1 text-weight-bold q-mt-none">Módulos da empresa</p>
              <div class="row">
                <q-checkbox
                  v-for="m in modulosDisponiveis"
                  :key="m.value"
                  v-model="modulosSelecionados"
                  :val="m.value"
                  :label="m.label"
                  class="q-mr-md"
                />
              </div>
              <q-banner dense rounded class="bg-blue-1 text-grey-9 q-mt-md">
                Os usuários da empresa precisam entrar de novo para ver o menu atualizado.
              </q-banner>
              <div class="row justify-end q-mt-md">
                <q-btn
                  unelevated
                  label="Salvar"
                  color="primary"
                  icon="save"
                  @click="salvarModulos"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- Usuários -->
        <q-tab-panel name="usuarios" class="q-pa-none">
          <empresa-usuarios :empresa-uuid="empresa.uuid" />
        </q-tab-panel>
      </q-tab-panels>
    </template>

    <!-- Dialog: Criar/Editar Domínio -->
    <q-dialog v-model="dialogDominio.aberto" persistent>
      <q-card style="max-width: 480px; width: 100%">
        <q-card-section class="row items-center">
          <span class="text-h6">{{
            dialogDominio.editando ? "Editar Domínio" : "Novo Domínio"
          }}</span>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form greedy @submit.prevent="salvarDominio">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="dialogDominio.form.domain"
                  label="Domínio *"
                  filled
                  :rules="[(v) => !!v || 'Obrigatório']"
                  lazy-rules
                  hint="Origem exata, sem barra final. Ex: https://app.minhaempresa.com.br"
                />
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="dialogDominio.form.active"
                  label="Domínio ativo"
                  color="positive"
                />
              </div>
            </div>

            <div class="row justify-end q-gutter-sm form-actions q-mt-md">
              <q-btn v-close-popup flat label="Cancelar" color="grey-7" />
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
import type { EmpresaDetalhe, EmpresaDominio } from "src/@modules/admin/empresa.http";
import { AdminEmpresaService, MODULOS_EMPRESA, UFS } from "./admin.service";
import EmpresaUsuarios from "./empresaUsuarios.vue";

const dominioFormVazio = () => ({ domain: "", active: true });

export default defineComponent({
  name: "AdminEmpresaEditar",
  components: { EmpresaUsuarios },
  setup() {
    const $route = useRoute();
    const $service = new AdminEmpresaService();
    const uuid = $route.params.uuid as string;

    const data = reactive({
      aba: "dados",
      empresa: null as EmpresaDetalhe | null,
      form: {
        name: "",
        commercialName: "",
        fantasyName: "",
        stateRegistration: "",
        cpfCnpj: "",
        email: "",
        phone: "",
        uf: "",
        address: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "" },
      },
      dominios: [] as EmpresaDominio[],
      modulosSelecionados: [] as string[],
      dialogDominio: {
        aberto: false,
        editando: false,
        uuid: "",
        form: dominioFormVazio(),
      },
    });

    function carregarForm(empresa: EmpresaDetalhe) {
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
      const empresa = await $service.detalhar(uuid);
      if (empresa) {
        data.empresa = empresa;
        data.dominios = empresa.dominios ?? [];
        data.modulosSelecionados = [...(empresa.modulos ?? [])];
        carregarForm(empresa);
      }
    }

    async function salvar() {
      const f = data.form;
      const ok = await $service.editar(uuid, {
        name: f.name,
        cpfCnpj: f.cpfCnpj,
        commercialName: f.commercialName || undefined,
        fantasyName: f.fantasyName || undefined,
        stateRegistration: f.stateRegistration || undefined,
        email: f.email || undefined,
        phone: f.phone || undefined,
        uf: f.uf || undefined,
        address: f.address,
      });
      if (ok) await carregar();
    }

    async function salvarModulos() {
      const ok = await $service.definirModulos(uuid, data.modulosSelecionados);
      if (ok && data.empresa) data.empresa.modulos = [...data.modulosSelecionados];
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
      data.dominios = await $service.listarDominios(uuid);
    }

    function abrirDialogDominio(dominio?: EmpresaDominio) {
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
      const input = { domain: form.domain.trim(), active: form.active };
      const ok = data.dialogDominio.editando
        ? await $service.editarDominio(uuid, data.dialogDominio.uuid, input)
        : await $service.criarDominio(uuid, input);
      if (ok) {
        data.dialogDominio.aberto = false;
        await carregarDominios();
      }
    }

    async function removerDominio(dominioUuid: string) {
      const ok = await $service.deletarDominio(uuid, dominioUuid);
      if (ok) await carregarDominios();
    }

    onMounted(() => void carregar());

    return {
      ...toRefs(data),
      opcoesUf: UFS,
      modulosDisponiveis: MODULOS_EMPRESA,
      salvar,
      salvarModulos,
      formatarData,
      abrirDialogDominio,
      salvarDominio,
      removerDominio,
    };
  },
});
</script>
