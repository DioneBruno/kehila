<!-- O form é um objeto reativo do pai, editado por este componente de propósito -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Partes</p>
    </div>
    <div class="col-12 col-md-6">
      <q-select
        v-model="form.imovelUuid"
        label="Imóvel *"
        hint="Só aparecem imóveis livres"
        filled
        use-input
        input-debounce="300"
        emit-value
        map-options
        :options="imoveis.opcoes.value"
        :readonly="readonly || edicao"
        :rules="[(v) => !!v || 'O imóvel é obrigatório']"
        lazy-rules
        no-error-icon
        @filter="imoveis.filtrar"
        @update:model-value="(v) => (form.imovelIdentificacao = imoveis.rotulo(v))"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">Nenhum imóvel livre encontrado</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-12 col-md-4">
      <q-select
        v-model="form.inquilinoUuid"
        label="Inquilino *"
        filled
        use-input
        input-debounce="300"
        emit-value
        map-options
        :options="inquilinos.opcoes.value"
        :readonly="readonly || edicao"
        :rules="[(v) => !!v || 'O inquilino é obrigatório']"
        lazy-rules
        no-error-icon
        @filter="inquilinos.filtrar"
        @update:model-value="(v) => (form.inquilinoNome = inquilinos.rotulo(v))"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">Nenhum inquilino encontrado</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-12 col-md-2 flex items-start">
      <q-btn
        v-if="!readonly && !edicao"
        flat
        no-caps
        icon="person_add"
        color="primary"
        label="Nova pessoa"
        target="_blank"
        :to="{ name: 'imoveis.pessoas.criar', query: { papel: 'inquilino' } }"
        class="q-mt-sm"
      />
    </div>

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Vigência e valor</p>
    </div>
    <div class="col-12 col-md-3">
      <q-input v-model="form.numero" label="Número do contrato" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.inicio"
        label="Início *"
        type="date"
        filled
        stack-label
        :readonly="readonly"
        :rules="[(v) => !!v || 'O início é obrigatório']"
        lazy-rules
        no-error-icon
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.fim"
        label="Fim *"
        type="date"
        filled
        stack-label
        :readonly="readonly || edicao"
        :hint="edicao ? 'Use Renovar ou Aditivo' : undefined"
        :rules="[
          (v) => !!v || 'O fim é obrigatório',
          (v) => !form.inicio || !v || v > form.inicio || 'O fim deve ser posterior ao início',
        ]"
        lazy-rules
        no-error-icon
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.valorAluguel"
        label="Valor do aluguel (R$) *"
        type="number"
        min="0"
        step="0.01"
        filled
        :readonly="readonly || edicao"
        :hint="edicao ? 'Use Renovar ou Aditivo' : undefined"
        :rules="[(v) => (v !== '' && Number(v) >= 0) || 'Informe o valor do aluguel']"
        lazy-rules
        no-error-icon
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.diaVencimento"
        label="Dia de vencimento *"
        type="number"
        min="1"
        max="31"
        filled
        :readonly="readonly"
        :rules="[
          (v) =>
            (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 31) ||
            'Informe um dia de 1 a 31',
        ]"
        lazy-rules
        no-error-icon
      />
    </div>

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Reajuste e encargos</p>
    </div>
    <div class="col-12 col-md-3">
      <q-select
        v-model="form.indiceReajuste"
        label="Índice de reajuste *"
        filled
        emit-value
        map-options
        :options="indices"
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-select
        v-model="form.mesReajuste"
        label="Mês do reajuste"
        hint="Padrão: mês do início"
        filled
        clearable
        emit-value
        map-options
        :options="meses"
        :readonly="readonly || form.indiceReajuste === 'nenhum'"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.multaAtrasoPct"
        label="Multa por atraso (%)"
        type="number"
        min="0"
        step="0.01"
        filled
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.jurosMesPct"
        label="Juros ao mês (%)"
        type="number"
        min="0"
        step="0.01"
        filled
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.descontoPontualidadePct"
        label="Desconto de pontualidade (%)"
        type="number"
        min="0"
        step="0.01"
        filled
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.multaRescisoriaMeses"
        label="Multa rescisória (meses)"
        type="number"
        min="0"
        step="0.1"
        filled
        :readonly="readonly"
      />
    </div>

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Garantia</p>
    </div>
    <div class="col-12 col-md-3">
      <q-select
        v-model="form.garantiaTipo"
        label="Tipo de garantia *"
        filled
        emit-value
        map-options
        :options="garantias"
        :readonly="readonly"
      />
    </div>
    <div v-if="temValorGarantia" class="col-12 col-md-3">
      <q-input
        v-model="form.garantiaValor"
        label="Valor da garantia (R$)"
        type="number"
        min="0"
        step="0.01"
        filled
        :readonly="readonly"
      />
    </div>
    <template v-if="form.garantiaTipo === 'fiador'">
      <div class="col-12 col-md-4">
        <q-select
          v-model="form.fiadorUuid"
          label="Fiador *"
          filled
          use-input
          input-debounce="300"
          emit-value
          map-options
          :options="fiadores.opcoes.value"
          :readonly="readonly"
          :rules="[(v) => !!v || 'Informe o fiador']"
          lazy-rules
          no-error-icon
          @filter="fiadores.filtrar"
          @update:model-value="(v) => (form.fiadorNome = fiadores.rotulo(v))"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">Nenhum fiador encontrado</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-12 col-md-2 flex items-start">
        <q-btn
          v-if="!readonly"
          flat
          no-caps
          icon="person_add"
          color="primary"
          label="Nova pessoa"
          target="_blank"
          :to="{ name: 'imoveis.pessoas.criar', query: { papel: 'fiador' } }"
          class="q-mt-sm"
        />
      </div>
    </template>

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
import { computed, defineComponent, ref, watch, type PropType, type Ref } from "vue";
import type {
  Contrato,
  ContratoEditavelInput,
  ContratoInput,
  GarantiaTipo,
  IndiceReajuste,
} from "src/@modules/imoveis/contrato.http";
import { GARANTIA_TIPOS, INDICES_REAJUSTE, ImoveisService } from "./imoveis.service";

export type ContratoFormModel = {
  imovelUuid: string;
  /** Só para exibir o que já está selecionado; não vai para a API. */
  imovelIdentificacao: string;
  inquilinoUuid: string;
  inquilinoNome: string;
  fiadorUuid: string;
  fiadorNome: string;
  numero: string;
  inicio: string;
  fim: string;
  valorAluguel: string;
  diaVencimento: string;
  indiceReajuste: IndiceReajuste;
  mesReajuste: number | null;
  multaAtrasoPct: string;
  jurosMesPct: string;
  descontoPontualidadePct: string;
  multaRescisoriaMeses: string;
  garantiaTipo: GarantiaTipo;
  garantiaValor: string;
  observacoes: string;
};

const GARANTIAS_COM_VALOR: GarantiaTipo[] = ["caucao", "seguro_fianca", "titulo_capitalizacao"];

const texto = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function novoContratoForm(contrato?: Contrato | null): ContratoFormModel {
  return {
    imovelUuid: contrato?.imovelUuid ?? "",
    imovelIdentificacao: contrato?.imovelIdentificacao ?? "",
    inquilinoUuid: contrato?.inquilinoUuid ?? "",
    inquilinoNome: contrato?.inquilinoNome ?? "",
    fiadorUuid: contrato?.fiadorUuid ?? "",
    fiadorNome: contrato?.fiadorNome ?? "",
    numero: contrato?.numero ?? "",
    inicio: contrato?.inicio ?? "",
    fim: contrato?.fim ?? "",
    valorAluguel: texto(contrato?.valorAluguel),
    diaVencimento: texto(contrato?.diaVencimento),
    indiceReajuste: contrato?.indiceReajuste ?? "IGPM",
    mesReajuste: contrato?.mesReajuste ?? null,
    multaAtrasoPct: contrato ? texto(contrato.multaAtrasoPct) : "2",
    jurosMesPct: contrato ? texto(contrato.jurosMesPct) : "1",
    descontoPontualidadePct: texto(contrato?.descontoPontualidadePct),
    multaRescisoriaMeses: texto(contrato?.multaRescisoriaMeses),
    garantiaTipo: contrato?.garantiaTipo ?? "nenhuma",
    garantiaValor: texto(contrato?.garantiaValor),
    observacoes: contrato?.observacoes ?? "",
  };
}

const numeroOuNulo = (v: string) => (String(v ?? "").trim() === "" ? null : Number(v));
const textoOuNulo = (v: string) => (v && v.trim() ? v.trim() : null);

/** Campos que podem ser alterados depois de criado (fim e valor só mudam por evento). Vazio vira null: limpa o valor. */
export function contratoFormParaEdicao(form: ContratoFormModel): ContratoEditavelInput {
  const comFiador = form.garantiaTipo === "fiador";
  return {
    numero: textoOuNulo(form.numero),
    inicio: form.inicio,
    diaVencimento: Number(form.diaVencimento),
    indiceReajuste: form.indiceReajuste,
    mesReajuste: form.indiceReajuste === "nenhum" ? null : form.mesReajuste,
    multaAtrasoPct: Number(form.multaAtrasoPct || 0),
    jurosMesPct: Number(form.jurosMesPct || 0),
    descontoPontualidadePct: numeroOuNulo(form.descontoPontualidadePct),
    multaRescisoriaMeses: numeroOuNulo(form.multaRescisoriaMeses),
    garantiaTipo: form.garantiaTipo,
    garantiaValor: GARANTIAS_COM_VALOR.includes(form.garantiaTipo)
      ? numeroOuNulo(form.garantiaValor)
      : null,
    fiadorUuid: comFiador ? form.fiadorUuid || null : null,
    observacoes: textoOuNulo(form.observacoes),
  };
}

export function contratoFormParaInclusao(form: ContratoFormModel): ContratoInput {
  const base = contratoFormParaEdicao(form);
  // Na inclusão, mês vazio deixa o backend usar o mês do início.
  if (base.mesReajuste === null) delete base.mesReajuste;
  return {
    ...base,
    imovelUuid: form.imovelUuid,
    inquilinoUuid: form.inquilinoUuid,
    inicio: form.inicio,
    fim: form.fim,
    valorAluguel: Number(form.valorAluguel),
  };
}

type Opcao = { value: string; label: string };

/** Select com busca no servidor que mantém a opção já escolhida na lista. */
function criarBusca(
  buscar: (texto: string) => Promise<Opcao[]>,
  atual: () => Opcao | null,
): {
  opcoes: Ref<Opcao[]>;
  filtrar: (t: string, u: (fn: () => void) => void) => void;
  rotulo: (v: string | null) => string;
  garantirAtual: () => void;
} {
  const opcoes = ref<Opcao[]>([]);
  const comAtual = (lista: Opcao[]) => {
    const a = atual();
    return a && !lista.some((o) => o.value === a.value) ? [a, ...lista] : lista;
  };
  const garantirAtual = () => {
    opcoes.value = comAtual(opcoes.value);
  };
  const filtrar = (t: string, update: (fn: () => void) => void) => {
    void buscar(t.trim()).then((lista) => {
      update(() => {
        opcoes.value = comAtual(lista);
      });
    });
  };
  const rotulo = (v: string | null) => opcoes.value.find((o) => o.value === v)?.label ?? "";
  garantirAtual();
  return { opcoes, filtrar, rotulo, garantirAtual };
}

export default defineComponent({
  name: "ContratoForm",
  props: {
    form: { type: Object as PropType<ContratoFormModel>, required: true },
    readonly: { type: Boolean, default: false },
    /** Contrato já existente: imóvel/inquilino/fim/valor ficam somente leitura. */
    edicao: { type: Boolean, default: false },
  },
  setup(props) {
    const $service = new ImoveisService();

    const imoveis = criarBusca(
      async (busca) => {
        const r = await $service.listarImoveis({
          situacao: "livre",
          busca: busca || undefined,
          porPagina: 30,
        });
        return (r?.itens ?? []).map((i) => ({ value: i.uuid, label: i.identificacao }));
      },
      () =>
        props.form.imovelUuid
          ? { value: props.form.imovelUuid, label: props.form.imovelIdentificacao }
          : null,
    );
    const pessoasPorPapel = (papel: "inquilino" | "fiador") => async (busca: string) => {
      const r = await $service.listarPessoas({ papel, busca: busca || undefined, porPagina: 30 });
      return (r?.itens ?? []).map((p) => ({ value: p.uuid, label: p.nome }));
    };
    const inquilinos = criarBusca(pessoasPorPapel("inquilino"), () =>
      props.form.inquilinoUuid
        ? { value: props.form.inquilinoUuid, label: props.form.inquilinoNome }
        : null,
    );
    const fiadores = criarBusca(pessoasPorPapel("fiador"), () =>
      props.form.fiadorUuid ? { value: props.form.fiadorUuid, label: props.form.fiadorNome } : null,
    );

    // O pai preenche o form depois de carregar (edição) ou pré-seleciona o imóvel (?imovel=).
    watch(
      () => [props.form.imovelUuid, props.form.inquilinoUuid, props.form.fiadorUuid],
      () => {
        imoveis.garantirAtual();
        inquilinos.garantirAtual();
        fiadores.garantirAtual();
      },
    );

    return {
      imoveis,
      inquilinos,
      fiadores,
      indices: INDICES_REAJUSTE,
      garantias: GARANTIA_TIPOS,
      meses: [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ].map((label, i) => ({ label, value: i + 1 })),
      temValorGarantia: computed(() => GARANTIAS_COM_VALOR.includes(props.form.garantiaTipo)),
    };
  },
});
</script>
