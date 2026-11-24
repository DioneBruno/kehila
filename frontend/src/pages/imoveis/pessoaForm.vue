<!-- O form é um objeto reativo do pai, editado por este componente de propósito -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Identificação</p>
    </div>
    <div class="col-12">
      <q-btn-toggle
        v-model="form.tipo"
        unelevated
        no-caps
        toggle-color="primary"
        color="grey-3"
        text-color="grey-8"
        :options="tipos"
        :disable="readonly || tipoFixo"
      />
    </div>
    <div class="col-12 col-md-6">
      <q-input
        v-model="form.nome"
        :label="ehPj ? 'Razão social *' : 'Nome *'"
        filled
        :readonly="readonly"
        :rules="[(v) => !!v?.trim() || 'O nome é obrigatório']"
        lazy-rules
      />
    </div>
    <div v-if="ehPj" class="col-12 col-md-6">
      <q-input v-model="form.nomeFantasia" label="Nome fantasia" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-if="ehPj"
        key="cnpj"
        v-model="form.documento"
        label="CNPJ *"
        filled
        mask="##.###.###/####-##"
        unmasked-value
        :readonly="readonly"
        :rules="[(v) => !!v?.trim() || 'O CNPJ é obrigatório']"
        lazy-rules
      />
      <q-input
        v-else
        key="cpf"
        v-model="form.documento"
        label="CPF *"
        filled
        mask="###.###.###-##"
        unmasked-value
        :readonly="readonly"
        :rules="[(v) => !!v?.trim() || 'O CPF é obrigatório']"
        lazy-rules
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.rgIe"
        :label="ehPj ? 'Inscrição estadual' : 'RG'"
        filled
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.telefone"
        label="Telefone"
        filled
        mask="(##) #####-####"
        unmasked-value
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-6">
      <q-input v-model="form.email" label="E-mail" filled type="email" :readonly="readonly" />
    </div>

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Papéis</p>
    </div>
    <div class="col-12 row">
      <q-checkbox v-model="form.ehProprietario" label="Proprietário" :disable="readonly" />
      <q-checkbox v-model="form.ehInquilino" label="Inquilino" :disable="readonly" />
      <q-checkbox v-model="form.ehFiador" label="Fiador" :disable="readonly" />
    </div>

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Endereço</p>
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.enderecoCep"
        label="CEP"
        filled
        mask="#####-###"
        unmasked-value
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-7">
      <q-input v-model="form.enderecoLogradouro" label="Logradouro" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-2">
      <q-input v-model="form.enderecoNumero" label="Número" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-4">
      <q-input v-model="form.enderecoComplemento" label="Complemento" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-3">
      <q-input v-model="form.enderecoBairro" label="Bairro" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-3">
      <q-input v-model="form.enderecoCidade" label="Cidade" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-2">
      <q-input
        v-model="form.enderecoUf"
        label="UF"
        filled
        mask="AA"
        :readonly="readonly"
        @update:model-value="(v) => (form.enderecoUf = String(v ?? '').toUpperCase())"
      />
    </div>

    <div class="col-12">
      <q-input
        v-model="form.observacoes"
        label="Observações"
        filled
        type="textarea"
        autogrow
        :readonly="readonly"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import type {
  Pessoa,
  PessoaInput,
  PessoaPapel,
  PessoaTipo,
} from "src/@modules/imoveis/pessoa.http";
import { PESSOA_TIPOS } from "./imoveis.service";

export type PessoaFormModel = {
  tipo: PessoaTipo;
  documento: string;
  nome: string;
  nomeFantasia: string;
  rgIe: string;
  email: string;
  telefone: string;
  enderecoCep: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  observacoes: string;
  ehProprietario: boolean;
  ehInquilino: boolean;
  ehFiador: boolean;
};

/** Sem `pessoa`, devolve o form de cadastro com o papel da tela pré-marcado. */
export function novaPessoaForm(
  papel?: PessoaPapel | null,
  pessoa?: Pessoa | null,
): PessoaFormModel {
  return {
    tipo: pessoa?.tipo ?? "PF",
    documento: pessoa?.documento ?? "",
    nome: pessoa?.nome ?? "",
    nomeFantasia: pessoa?.nomeFantasia ?? "",
    rgIe: pessoa?.rgIe ?? "",
    email: pessoa?.email ?? "",
    telefone: pessoa?.telefone ?? "",
    enderecoCep: pessoa?.enderecoCep ?? "",
    enderecoLogradouro: pessoa?.enderecoLogradouro ?? "",
    enderecoNumero: pessoa?.enderecoNumero ?? "",
    enderecoComplemento: pessoa?.enderecoComplemento ?? "",
    enderecoBairro: pessoa?.enderecoBairro ?? "",
    enderecoCidade: pessoa?.enderecoCidade ?? "",
    enderecoUf: pessoa?.enderecoUf ?? "",
    observacoes: pessoa?.observacoes ?? "",
    ehProprietario: pessoa?.ehProprietario ?? papel === "proprietario",
    ehInquilino: pessoa?.ehInquilino ?? papel === "inquilino",
    ehFiador: pessoa?.ehFiador ?? papel === "fiador",
  };
}

/** Converte o form em payload da API: textos vazios viram null (limpa o valor no banco). */
export function pessoaFormParaInput(form: PessoaFormModel): PessoaInput {
  const nulo = (v: string) => (v && v.trim() ? v.trim() : null);
  const pj = form.tipo === "PJ";
  return {
    tipo: form.tipo,
    documento: form.documento.trim(),
    nome: form.nome.trim(),
    nomeFantasia: pj ? nulo(form.nomeFantasia) : null,
    rgIe: nulo(form.rgIe),
    email: nulo(form.email),
    telefone: nulo(form.telefone),
    endereco: {
      cep: nulo(form.enderecoCep),
      logradouro: nulo(form.enderecoLogradouro),
      numero: nulo(form.enderecoNumero),
      complemento: nulo(form.enderecoComplemento),
      bairro: nulo(form.enderecoBairro),
      cidade: nulo(form.enderecoCidade),
      uf: nulo(form.enderecoUf),
    },
    observacoes: nulo(form.observacoes),
    ehProprietario: form.ehProprietario,
    ehInquilino: form.ehInquilino,
    ehFiador: form.ehFiador,
  };
}

export default defineComponent({
  name: "PessoaForm",
  props: {
    form: { type: Object as PropType<PessoaFormModel>, required: true },
    readonly: { type: Boolean, default: false },
    /** Na edição o tipo (PF/PJ) não pode mudar. */
    tipoFixo: { type: Boolean, default: false },
  },
  setup(props) {
    const ehPj = computed(() => props.form.tipo === "PJ");
    return { tipos: PESSOA_TIPOS.map((t) => ({ label: t.label, value: t.value })), ehPj };
  },
});
</script>
