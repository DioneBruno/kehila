<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-lg">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Nova empresa</p>
        <p class="text-caption text-grey-6 q-ma-none">
          Cadastra a empresa, o domínio de acesso e o usuário administrador
        </p>
      </div>
    </div>

    <q-form greedy @submit.prevent="salvar">
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <p class="text-subtitle1 text-weight-bold q-mt-none">Empresa</p>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input
                v-model="form.cpfCnpj"
                label="CPF/CNPJ *"
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
                label="Razão Social *"
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
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <p class="text-subtitle1 text-weight-bold q-mt-none">Acesso</p>
          <q-input
            v-model="form.dominio"
            label="Domínio *"
            filled
            :rules="[(v) => !!v || 'Obrigatório']"
            lazy-rules
            hint="Origem exata, sem barra final. Ex: https://app.minhaempresa.com.br"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <p class="text-subtitle1 text-weight-bold q-mt-none">Módulos</p>
          <div class="row">
            <q-checkbox
              v-for="m in modulosDisponiveis"
              :key="m.value"
              v-model="form.modulos"
              :val="m.value"
              :label="m.label"
              class="q-mr-md"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <p class="text-subtitle1 text-weight-bold q-mt-none">Usuário administrador</p>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.admin.name"
                label="Nome *"
                filled
                :rules="[(v) => !!v || 'Obrigatório']"
                lazy-rules
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.admin.email" label="E-mail" type="email" filled />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="form.admin.cpf"
                label="CPF"
                filled
                unmasked-value
                fill-mask
                mask="###.###.###-##"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="form.admin.phone"
                label="Telefone"
                filled
                unmasked-value
                fill-mask
                mask="(##) #####-####"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="form.admin.password"
                label="Senha *"
                filled
                :type="mostrarSenha ? 'text' : 'password'"
                hint="mínimo 8 caracteres"
                autocomplete="new-password"
                :rules="[(v) => !!v || 'Obrigatório']"
                lazy-rules
              >
                <template v-slot:append>
                  <q-icon
                    :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="mostrarSenha = !mostrarSenha"
                  />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm">
        <q-btn flat label="Cancelar" color="grey-7" :to="{ name: 'admin.empresas' }" />
        <q-btn unelevated type="submit" label="Cadastrar" color="primary" icon="save" />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import { AdminEmpresaService, MODULOS_EMPRESA, UFS } from "./admin.service";

export default defineComponent({
  name: "AdminEmpresaIncluir",
  setup() {
    const $router = useRouter();
    const $service = new AdminEmpresaService();

    const data = reactive({
      mostrarSenha: false,
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
        dominio: "",
        modulos: ["igreja"] as string[],
        admin: { name: "", email: "", cpf: "", phone: "", password: "" },
      },
    });

    async function salvar() {
      const f = data.form;
      const dominio = f.dominio.trim();
      const uuid = await $service.cadastrar({
        empresa: {
          name: f.name,
          cpfCnpj: f.cpfCnpj,
          commercialName: f.commercialName || undefined,
          fantasyName: f.fantasyName || undefined,
          stateRegistration: f.stateRegistration || undefined,
          email: f.email || undefined,
          phone: f.phone || undefined,
          uf: f.uf || undefined,
          address: f.address,
        },
        dominio,
        modulos: f.modulos,
        admin: {
          name: f.admin.name,
          email: f.admin.email || undefined,
          cpf: f.admin.cpf || undefined,
          phone: f.admin.phone || undefined,
          password: f.admin.password,
        },
      });
      if (uuid) {
        $service.notificarCriada(dominio);
        await $router.replace({ name: "admin.empresas.editar", params: { uuid } });
      }
    }

    return {
      ...toRefs(data),
      opcoesUf: UFS,
      modulosDisponiveis: MODULOS_EMPRESA,
      salvar,
    };
  },
});
</script>
