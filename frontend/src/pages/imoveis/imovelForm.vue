<!-- O form é um objeto reativo do pai, editado por este componente de propósito -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Identificação</p>
    </div>
    <div class="col-12 col-md-8">
      <q-select
        v-model="form.proprietarioUuid"
        label="Proprietário *"
        filled
        use-input
        input-debounce="300"
        emit-value
        map-options
        :options="opcoesProprietario"
        :readonly="readonly"
        :rules="[(v) => !!v || 'O proprietário é obrigatório']"
        lazy-rules
        no-error-icon
        @filter="filtrarProprietarios"
        @update:model-value="selecionarProprietario"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">Nenhum proprietário encontrado</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-12 col-md-4 flex items-start">
      <q-btn
        v-if="!readonly"
        flat
        no-caps
        icon="person_add"
        color="primary"
        label="Novo proprietário"
        target="_blank"
        :to="{ name: 'imoveis.pessoas.criar', query: { papel: 'proprietario' } }"
        class="q-mt-sm"
      />
    </div>
    <div class="col-12 col-md-6">
      <q-input
        v-model="form.identificacao"
        label="Identificação *"
        hint="Como você chama este imóvel. Ex.: Apto 302 - Ed. Aurora"
        filled
        :readonly="readonly"
        :rules="[(v) => !!v?.trim() || 'A identificação é obrigatória']"
        lazy-rules
      />
    </div>
    <div class="col-12 col-md-3">
      <q-select
        v-model="form.tipo"
        label="Tipo *"
        filled
        emit-value
        map-options
        :options="tipos"
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-select
        v-model="form.finalidade"
        label="Finalidade *"
        filled
        emit-value
        map-options
        :options="finalidades"
        :readonly="readonly"
      />
    </div>
    <div v-if="mostrarSituacao" class="col-12 col-md-3">
      <q-select
        v-model="form.situacao"
        label="Situação"
        filled
        emit-value
        map-options
        :options="situacoes"
        option-disable="disable"
        :readonly="readonly || situacaoBloqueada"
        :hint="situacaoBloqueada ? 'Definida pelo contrato vigente' : undefined"
      />
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

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Registro</p>
    </div>
    <div class="col-12 col-md-3">
      <q-input v-model="form.inscricaoIptu" label="Inscrição IPTU" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-3">
      <q-input v-model="form.matricula" label="Matrícula" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-3">
      <q-input v-model="form.cartorio" label="Cartório" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.areaM2"
        label="Área (m²)"
        filled
        type="number"
        min="0"
        step="any"
        :readonly="readonly"
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
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import type {
  ImovelDetalhe,
  ImovelFinalidade,
  ImovelInput,
  ImovelSituacao,
  ImovelTipo,
} from "src/@modules/imoveis/imovel.http";
import {
  IMOVEL_FINALIDADES,
  IMOVEL_SITUACOES,
  IMOVEL_TIPOS,
  ImoveisService,
} from "./imoveis.service";

export type ImovelFormModel = {
  proprietarioUuid: string;
  /** Só para exibir o nome já selecionado (edição); não vai para a API. */
  proprietarioNome: string;
  identificacao: string;
  tipo: ImovelTipo;
  finalidade: ImovelFinalidade;
  situacao: ImovelSituacao;
  enderecoCep: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  inscricaoIptu: string;
  matricula: string;
  cartorio: string;
  areaM2: string;
  observacoes: string;
};

export function novoImovelForm(
  imovel?: ImovelDetalhe | null,
  proprietario?: { uuid: string; nome: string },
): ImovelFormModel {
  return {
    proprietarioUuid: imovel?.proprietarioUuid ?? proprietario?.uuid ?? "",
    proprietarioNome: imovel?.proprietarioNome ?? proprietario?.nome ?? "",
    identificacao: imovel?.identificacao ?? "",
    tipo: imovel?.tipo ?? "apartamento",
    finalidade: imovel?.finalidade ?? "residencial",
    situacao: imovel?.situacao ?? "livre",
    enderecoCep: imovel?.enderecoCep ?? "",
    enderecoLogradouro: imovel?.enderecoLogradouro ?? "",
    enderecoNumero: imovel?.enderecoNumero ?? "",
    enderecoComplemento: imovel?.enderecoComplemento ?? "",
    enderecoBairro: imovel?.enderecoBairro ?? "",
    enderecoCidade: imovel?.enderecoCidade ?? "",
    enderecoUf: imovel?.enderecoUf ?? "",
    inscricaoIptu: imovel?.inscricaoIptu ?? "",
    matricula: imovel?.matricula ?? "",
    cartorio: imovel?.cartorio ?? "",
    areaM2: imovel?.areaM2 === null || imovel?.areaM2 === undefined ? "" : String(imovel.areaM2),
    observacoes: imovel?.observacoes ?? "",
  };
}

/** Converte o form em payload da API: textos vazios viram null (limpa o valor no banco). `situacao` só vale na alteração. */
export function imovelFormParaInput(form: ImovelFormModel): ImovelInput {
  const nulo = (v: string) => (v && v.trim() ? v.trim() : null);
  const area = String(form.areaM2 ?? "").trim();
  return {
    proprietarioUuid: form.proprietarioUuid,
    identificacao: form.identificacao.trim(),
    tipo: form.tipo,
    finalidade: form.finalidade,
    situacao: form.situacao,
    endereco: {
      cep: nulo(form.enderecoCep),
      logradouro: nulo(form.enderecoLogradouro),
      numero: nulo(form.enderecoNumero),
      complemento: nulo(form.enderecoComplemento),
      bairro: nulo(form.enderecoBairro),
      cidade: nulo(form.enderecoCidade),
      uf: nulo(form.enderecoUf),
    },
    inscricaoIptu: nulo(form.inscricaoIptu),
    matricula: nulo(form.matricula),
    cartorio: nulo(form.cartorio),
    areaM2: area === "" ? null : Number(area),
    observacoes: nulo(form.observacoes),
  };
}

export default defineComponent({
  name: "ImovelForm",
  props: {
    form: { type: Object as PropType<ImovelFormModel>, required: true },
    readonly: { type: Boolean, default: false },
    /** Edição: mostra o campo situação. */
    mostrarSituacao: { type: Boolean, default: false },
    /** Imóvel com contrato vigente: a situação é controlada pelo contrato. */
    situacaoBloqueada: { type: Boolean, default: false },
  },
  setup(props) {
    const $service = new ImoveisService();
    const opcoesProprietario = ref<{ value: string; label: string }[]>([]);

    function opcaoSelecionada() {
      return props.form.proprietarioUuid
        ? [{ value: props.form.proprietarioUuid, label: props.form.proprietarioNome }]
        : [];
    }
    opcoesProprietario.value = opcaoSelecionada();

    // Ao carregar o imóvel (edição), o proprietário atual precisa estar entre as opções.
    watch(
      () => props.form.proprietarioUuid,
      () => {
        if (!opcoesProprietario.value.some((o) => o.value === props.form.proprietarioUuid)) {
          opcoesProprietario.value = [...opcaoSelecionada(), ...opcoesProprietario.value];
        }
      },
    );

    // Guarda o nome da opção escolhida: é dele que opcaoSelecionada() depende nas próximas buscas.
    function selecionarProprietario(uuid: string | null) {
      const opcao = opcoesProprietario.value.find((o) => o.value === uuid);
      // eslint-disable-next-line vue/no-mutating-props
      props.form.proprietarioNome = opcao?.label ?? "";
    }

    function filtrarProprietarios(texto: string, update: (fn: () => void) => void) {
      void $service
        .listarPessoas({ papel: "proprietario", busca: texto.trim() || undefined, porPagina: 30 })
        .then((r) => {
          update(() => {
            const lista = (r?.itens ?? []).map((p) => ({ value: p.uuid, label: p.nome }));
            const atual = opcaoSelecionada()[0];
            opcoesProprietario.value =
              atual && !lista.some((o) => o.value === atual.value) ? [atual, ...lista] : lista;
          });
        });
    }

    return {
      opcoesProprietario,
      filtrarProprietarios,
      selecionarProprietario,
      tipos: IMOVEL_TIPOS,
      finalidades: IMOVEL_FINALIDADES,
      // "alugado" é definido pelo contrato: não pode ser escolhido à mão.
      situacoes: computed(() =>
        IMOVEL_SITUACOES.map((s) => ({
          label: s.label,
          value: s.value,
          disable: s.value === "alugado" && props.form.situacao !== "alugado",
        })),
      ),
    };
  },
});
</script>
