<!-- O form é um objeto reativo do pai, editado por este componente de propósito -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="row q-col-gutter-md">
    <!-- Identificação -->
    <div class="col-12">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Identificação</p>
    </div>
    <div class="col-12 col-md-6">
      <q-input
        v-model="form.nome"
        label="Nome *"
        filled
        :readonly="readonly"
        :rules="[(v) => !!v?.trim() || 'O nome é obrigatório']"
        lazy-rules
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.cpf"
        label="CPF"
        filled
        mask="###.###.###-##"
        unmasked-value
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
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.dataNascimento"
        label="Data de nascimento"
        filled
        type="date"
        stack-label
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-select
        v-model="form.estadoCivil"
        label="Estado civil"
        filled
        emit-value
        map-options
        clearable
        :options="estadosCivis"
        :readonly="readonly"
      />
    </div>

    <!-- Situação -->
    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Situação</p>
    </div>
    <div class="col-6 col-md-3">
      <q-toggle v-model="form.ativo" label="Ativo" :disable="readonly" />
    </div>
    <div class="col-6 col-md-3">
      <q-toggle v-model="form.membro" label="Membro" :disable="readonly" />
    </div>
    <div class="col-6 col-md-3">
      <q-toggle v-model="form.batizado" label="Batizado" :disable="readonly" />
    </div>
    <div class="col-6 col-md-3">
      <q-toggle v-model="form.transferido" label="Transferido" :disable="readonly" />
    </div>

    <!-- Endereço -->
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
        :loading="buscandoCep"
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, type PropType } from "vue";
import type { Membro, MembroInput } from "src/@modules/membresia/membresia.http";
import { ESTADOS_CIVIS } from "./membresia.service";

export type MembroFormModel = {
  nome: string;
  ativo: boolean;
  membro: boolean;
  batizado: boolean;
  transferido: boolean;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string | null;
  dataNascimento: string;
  enderecoCep: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
};

export function novoMembroForm(membro?: Membro | null): MembroFormModel {
  return {
    nome: membro?.nome ?? "",
    ativo: membro?.ativo ?? true,
    membro: membro?.membro ?? true,
    batizado: membro?.batizado ?? false,
    transferido: membro?.transferido ?? false,
    cpf: membro?.cpf ?? "",
    email: membro?.email ?? "",
    telefone: membro?.telefone ?? "",
    estadoCivil: membro?.estadoCivil ?? null,
    dataNascimento: membro?.dataNascimento ?? "",
    enderecoCep: membro?.enderecoCep ?? "",
    enderecoLogradouro: membro?.enderecoLogradouro ?? "",
    enderecoNumero: membro?.enderecoNumero ?? "",
    enderecoComplemento: membro?.enderecoComplemento ?? "",
    enderecoBairro: membro?.enderecoBairro ?? "",
    enderecoCidade: membro?.enderecoCidade ?? "",
    enderecoUf: membro?.enderecoUf ?? "",
  };
}

/** Converte o form em payload da API: campos de texto vazios viram null (limpa o valor no banco). */
export function membroFormParaInput(form: MembroFormModel): MembroInput {
  const vazioParaNull = (v: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    nome: form.nome.trim(),
    ativo: form.ativo,
    membro: form.membro,
    batizado: form.batizado,
    transferido: form.transferido,
    cpf: vazioParaNull(form.cpf),
    email: vazioParaNull(form.email),
    telefone: vazioParaNull(form.telefone),
    estadoCivil: vazioParaNull(form.estadoCivil),
    dataNascimento: vazioParaNull(form.dataNascimento),
    enderecoCep: vazioParaNull(form.enderecoCep),
    enderecoLogradouro: vazioParaNull(form.enderecoLogradouro),
    enderecoNumero: vazioParaNull(form.enderecoNumero),
    enderecoComplemento: vazioParaNull(form.enderecoComplemento),
    enderecoBairro: vazioParaNull(form.enderecoBairro),
    enderecoCidade: vazioParaNull(form.enderecoCidade),
    enderecoUf: vazioParaNull(form.enderecoUf),
  };
}

export default defineComponent({
  name: "MembroForm",
  props: {
    form: { type: Object as PropType<MembroFormModel>, required: true },
    readonly: { type: Boolean, default: false },
  },
  setup(props) {
    const buscandoCep = ref(false);

    async function buscarEndereco(cep: string) {
      buscandoCep.value = true;
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const endereco = await response.json();
        if (endereco.erro) return;
        /* eslint-disable vue/no-mutating-props */
        props.form.enderecoLogradouro = endereco.logradouro || props.form.enderecoLogradouro;
        props.form.enderecoBairro = endereco.bairro || props.form.enderecoBairro;
        props.form.enderecoCidade = endereco.localidade || props.form.enderecoCidade;
        props.form.enderecoUf = endereco.uf || props.form.enderecoUf;
        /* eslint-enable vue/no-mutating-props */
      } catch {
        // mantém os valores digitados
      } finally {
        buscandoCep.value = false;
      }
    }

    watch(
      () => props.form.enderecoCep,
      (cep, anterior) => {
        if (!props.readonly && cep?.length === 8 && cep !== anterior) void buscarEndereco(cep);
      },
    );

    return { buscandoCep, estadosCivis: ESTADOS_CIVIS };
  },
});
</script>
