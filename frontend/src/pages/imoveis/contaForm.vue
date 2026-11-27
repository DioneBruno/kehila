<!-- O form é um objeto reativo do pai, editado por este componente de propósito -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Classificação</p>
    </div>
    <div class="col-12 col-md-4">
      <q-select
        v-model="form.tipo"
        label="Tipo *"
        filled
        emit-value
        map-options
        :options="tipos"
        :readonly="readonly"
        @update:model-value="aoMudarTipo"
      />
    </div>
    <div class="col-12 col-md-4">
      <q-select
        v-model="form.categoria"
        label="Categoria *"
        filled
        emit-value
        map-options
        :options="categorias"
        :readonly="readonly"
        :rules="[(v) => !!v || 'A categoria é obrigatória']"
        lazy-rules
        no-error-icon
        @update:model-value="aoMudarCategoria"
      />
    </div>
    <div v-if="form.tipo === 'guia'" class="col-12 col-md-4">
      <q-select
        v-model="form.esfera"
        label="Esfera *"
        hint="Sugerida pela categoria"
        filled
        emit-value
        map-options
        :options="esferas"
        :readonly="readonly"
        :rules="[(v) => !!v || 'Informe a esfera da guia']"
        lazy-rules
        no-error-icon
      />
    </div>
    <div class="col-12">
      <q-input
        v-model="form.descricao"
        :label="form.categoria === 'outros' ? 'Descrição *' : 'Descrição'"
        filled
        :readonly="readonly"
        :rules="[(v) => form.categoria !== 'outros' || !!v?.trim() || 'Informe a descrição']"
        lazy-rules
        no-error-icon
      />
    </div>

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Imóvel e responsáveis</p>
    </div>
    <div class="col-12 col-md-6">
      <q-select
        v-model="form.imovelUuid"
        label="Imóvel"
        hint="Opcional"
        filled
        use-input
        clearable
        input-debounce="300"
        emit-value
        map-options
        :options="imoveis.opcoes.value"
        :readonly="readonly"
        @filter="imoveis.filtrar"
        @update:model-value="aoMudarImovel"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">Nenhum imóvel encontrado</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-12 col-md-6">
      <q-select
        v-model="form.contratoUuid"
        label="Contrato"
        :hint="form.imovelUuid ? 'Opcional' : 'Escolha um imóvel para ligar a um contrato'"
        filled
        clearable
        emit-value
        map-options
        :options="contratoOpcoes"
        :disable="!form.imovelUuid"
        :readonly="readonly"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">Este imóvel não tem contratos</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-12 col-md-6">
      <q-input
        v-if="form.imovelUuid"
        :model-value="form.proprietarioNome"
        label="Proprietário"
        hint="Definido pelo imóvel"
        filled
        readonly
      />
      <q-select
        v-else
        v-model="form.proprietarioUuid"
        label="Proprietário *"
        filled
        use-input
        input-debounce="300"
        emit-value
        map-options
        :options="proprietarios.opcoes.value"
        :readonly="readonly"
        :rules="[(v) => !!v || 'Informe o proprietário']"
        lazy-rules
        no-error-icon
        @filter="proprietarios.filtrar"
        @update:model-value="(v) => (form.proprietarioNome = proprietarios.rotulo(v))"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">Nenhum proprietário encontrado</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-12 col-md-6">
      <p class="text-caption text-grey-7 q-mb-xs">Quem paga</p>
      <q-btn-toggle
        v-model="form.responsavel"
        unelevated
        no-caps
        toggle-color="primary"
        color="grey-3"
        text-color="grey-8"
        :readonly="readonly"
        :options="responsaveis"
      />
      <p v-if="!form.contratoUuid" class="text-caption text-grey-6 q-ma-none q-mt-xs">
        O inquilino só pode pagar quando a conta tem contrato.
      </p>
    </div>

    <div class="col-12 q-mt-sm">
      <p class="text-caption text-grey-6 q-ma-none text-uppercase">Valores e prazos</p>
    </div>
    <template v-if="!form.parcelado">
      <div class="col-12 col-md-3">
        <q-input
          v-model="form.vencimento"
          label="Vencimento *"
          type="date"
          filled
          stack-label
          :readonly="readonly"
          :rules="[(v) => !!v || 'O vencimento é obrigatório']"
          lazy-rules
          no-error-icon
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="form.valor"
          label="Valor (R$) *"
          type="number"
          min="0"
          step="0.01"
          filled
          :readonly="readonly"
          :rules="[(v) => Number(v) > 0 || 'Informe um valor maior que zero']"
          lazy-rules
          no-error-icon
        />
      </div>
    </template>
    <template v-else>
      <div class="col-12 col-md-2">
        <q-input
          v-model="form.quantidade"
          label="Parcelas *"
          type="number"
          min="2"
          max="60"
          hint="De 2 a 60"
          filled
          :rules="[
            (v) =>
              (Number.isInteger(Number(v)) && Number(v) >= 2 && Number(v) <= 60) ||
              'A quantidade de parcelas deve ser entre 2 e 60',
          ]"
          lazy-rules
          no-error-icon
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="form.primeiroVencimento"
          label="Primeiro vencimento *"
          type="date"
          filled
          stack-label
          :rules="[(v) => !!v || 'O primeiro vencimento é obrigatório']"
          lazy-rules
          no-error-icon
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="form.valorParcela"
          label="Valor da parcela (R$) *"
          type="number"
          min="0"
          step="0.01"
          filled
          :rules="[(v) => Number(v) > 0 || 'Informe um valor maior que zero']"
          lazy-rules
          no-error-icon
        />
      </div>
    </template>
    <div class="col-12 col-md-3">
      <q-input
        v-model="form.competencia"
        label="Competência"
        :type="tipoMes"
        hint="Mês de referência (o da primeira parcela, se parcelada)"
        :rules="[(v) => !v || /^\d{4}-\d{2}$/.test(v) || 'Use AAAA-MM']"
        lazy-rules
        filled
        stack-label
        clearable
        :readonly="readonly"
      />
    </div>
    <div class="col-12 col-md-6">
      <q-input v-model="form.fornecedor" label="Fornecedor" filled :readonly="readonly" />
    </div>
    <div class="col-12 col-md-6">
      <q-input v-model="form.documentoNumero" label="Nº do documento" filled :readonly="readonly" />
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

    <template v-if="!edicao">
      <div class="col-12 q-mt-sm">
        <p class="text-caption text-grey-6 q-ma-none text-uppercase">Opções</p>
      </div>
      <div class="col-12 col-md-4">
        <q-toggle
          v-model="form.parcelado"
          label="Gerar em parcelas"
          @update:model-value="aoParcelar"
        />
      </div>
      <div v-if="!form.parcelado" class="col-12 col-md-8">
        <q-toggle v-model="form.paga" label="Já está paga" @update:model-value="aoMarcarPaga" />
      </div>
      <template v-if="form.paga && !form.parcelado">
        <div class="col-12 col-md-3">
          <q-input
            v-model="form.pagoEm"
            label="Pago em *"
            type="date"
            filled
            stack-label
            :max="hoje()"
            :rules="[(v) => !!v || 'A data do pagamento é obrigatória']"
            lazy-rules
            no-error-icon
          />
        </div>
        <div class="col-12 col-md-3">
          <q-input
            v-model="form.valorPago"
            label="Valor pago (R$)"
            type="number"
            min="0"
            step="0.01"
            hint="Em branco: o valor da conta"
            filled
            :rules="[(v) => v === '' || Number(v) >= 0 || 'Valor pago inválido']"
            lazy-rules
            no-error-icon
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import type { Contrato } from "src/@modules/imoveis/contrato.http";
import type {
  Conta,
  ContaEditavelInput,
  ContaEsfera,
  ContaInput,
  ContaResponsavel,
  ContaTipo,
  GerarParcelasInput,
} from "src/@modules/imoveis/conta.http";
import type { Imovel } from "src/@modules/imoveis/imovel.http";
import { criarBusca } from "./contratoForm.vue";
import {
  CATEGORIAS_POR_TIPO,
  CONTA_ESFERAS,
  CONTA_RESPONSAVEIS,
  CONTA_TIPOS,
  ESFERA_PADRAO_POR_CATEGORIA,
  ImoveisService,
  formatarData,
  labelStatus,
} from "./imoveis.service";

export type ContaFormModel = {
  tipo: ContaTipo;
  categoria: string;
  esfera: ContaEsfera | null;
  descricao: string;
  imovelUuid: string;
  /** Só para exibir o que já está selecionado; não vai para a API. */
  imovelIdentificacao: string;
  contratoUuid: string;
  proprietarioUuid: string;
  proprietarioNome: string;
  responsavel: ContaResponsavel;
  vencimento: string;
  valor: string;
  /** "AAAA-MM" (seletor mês/ano); vai para a API como AAAA-MM-01. */
  competencia: string;
  fornecedor: string;
  documentoNumero: string;
  observacoes: string;
  paga: boolean;
  pagoEm: string;
  valorPago: string;
  parcelado: boolean;
  quantidade: string;
  primeiroVencimento: string;
  valorParcela: string;
};

export function hoje() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const texto = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function novoContaForm(conta?: Conta | null): ContaFormModel {
  return {
    tipo: conta?.tipo ?? "encargo",
    categoria: conta?.categoria ?? "",
    esfera: conta?.esfera ?? null,
    descricao: conta?.descricao ?? "",
    imovelUuid: conta?.imovelUuid ?? "",
    imovelIdentificacao: conta?.imovelIdentificacao ?? "",
    contratoUuid: conta?.contratoUuid ?? "",
    proprietarioUuid: conta?.proprietarioUuid ?? "",
    proprietarioNome: conta?.proprietarioNome ?? "",
    responsavel: conta?.responsavel ?? "proprietario",
    vencimento: conta?.vencimento?.slice(0, 10) ?? "",
    valor: texto(conta?.valor),
    competencia: conta?.competencia?.slice(0, 7) ?? "",
    fornecedor: conta?.fornecedor ?? "",
    documentoNumero: conta?.documentoNumero ?? "",
    observacoes: conta?.observacoes ?? "",
    paga: false,
    pagoEm: "",
    valorPago: "",
    parcelado: false,
    quantidade: "",
    primeiroVencimento: "",
    valorParcela: "",
  };
}

const textoOuNulo = (v: string) => (v && v.trim() ? v.trim() : null);

/** Campos comuns às três operações. Com imóvel, o proprietário vem dele (o backend deriva). */
function camposComuns(form: ContaFormModel) {
  return {
    tipo: form.tipo,
    categoria: form.categoria,
    esfera: form.tipo === "guia" ? form.esfera : null,
    descricao: textoOuNulo(form.descricao),
    imovelUuid: form.imovelUuid || null,
    contratoUuid: form.imovelUuid ? form.contratoUuid || null : null,
    ...(form.imovelUuid ? {} : { proprietarioUuid: form.proprietarioUuid || null }),
    responsavel: form.responsavel,
    competencia: form.competencia ? `${form.competencia}-01` : null,
    fornecedor: textoOuNulo(form.fornecedor),
    documentoNumero: textoOuNulo(form.documentoNumero),
    observacoes: textoOuNulo(form.observacoes),
  };
}

export function contaFormParaInclusao(form: ContaFormModel): ContaInput {
  return {
    ...camposComuns(form),
    vencimento: form.vencimento,
    valor: Number(form.valor),
    ...(form.paga
      ? {
          pagoEm: form.pagoEm,
          valorPago: form.valorPago === "" ? Number(form.valor) : Number(form.valorPago),
        }
      : {}),
  };
}

export function contaFormParaParcelas(form: ContaFormModel): GerarParcelasInput {
  return {
    ...camposComuns(form),
    primeiroVencimento: form.primeiroVencimento,
    valorParcela: Number(form.valorParcela),
    quantidade: Number(form.quantidade),
  };
}

export function contaFormParaEdicao(form: ContaFormModel): ContaEditavelInput {
  return { ...camposComuns(form), vencimento: form.vencimento, valor: Number(form.valor) };
}

export default defineComponent({
  name: "ContaForm",
  props: {
    form: { type: Object as PropType<ContaFormModel>, required: true },
    readonly: { type: Boolean, default: false },
    /** Conta já existente: sem "já está paga" nem parcelas. */
    edicao: { type: Boolean, default: false },
  },
  setup(props) {
    // O form é um objeto reativo do pai, editado por este componente de propósito.
    const form = props.form;
    const $service = new ImoveisService();

    const imoveisCache = new Map<string, Imovel>();
    const imoveis = criarBusca(
      async (busca) => {
        const r = await $service.listarImoveis({ busca: busca || undefined, porPagina: 30 });
        (r?.itens ?? []).forEach((i) => imoveisCache.set(i.uuid, i));
        return (r?.itens ?? []).map((i) => ({ value: i.uuid, label: i.identificacao }));
      },
      () => (form.imovelUuid ? { value: form.imovelUuid, label: form.imovelIdentificacao } : null),
    );
    const proprietarios = criarBusca(
      async (busca) => {
        const r = await $service.listarPessoas({
          papel: "proprietario",
          busca: busca || undefined,
          porPagina: 30,
        });
        return (r?.itens ?? []).map((p) => ({ value: p.uuid, label: p.nome }));
      },
      () =>
        form.proprietarioUuid
          ? { value: form.proprietarioUuid, label: form.proprietarioNome }
          : null,
    );

    const contratos = ref<Contrato[]>([]);
    const contratoOpcoes = computed(() =>
      contratos.value.map((c) => ({
        value: c.uuid,
        label: [
          c.numero ? `Nº ${c.numero}` : null,
          c.inquilinoNome,
          `${formatarData(c.inicio)} a ${formatarData(c.fim)}`,
          labelStatus(c.status),
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    );

    const categorias = computed(() => CATEGORIAS_POR_TIPO[form.tipo] ?? []);

    function aoMudarTipo() {
      form.categoria = "";
      form.esfera = null;
    }

    function aoMudarCategoria(categoria: string) {
      if (form.tipo === "guia") {
        form.esfera = ESFERA_PADRAO_POR_CATEGORIA[categoria] ?? null;
      }
    }

    // Escolha feita pelo usuário (não o preenchimento do pai): reinicia contrato e dono.
    let escolhaDoUsuario = false;
    function aoMudarImovel(uuid: string | null) {
      escolhaDoUsuario = true;
      form.contratoUuid = "";
      if (!uuid) {
        form.imovelUuid = "";
        form.imovelIdentificacao = "";
        form.proprietarioUuid = "";
        form.proprietarioNome = "";
        proprietarios.garantirAtual();
      } else {
        form.imovelIdentificacao = imoveis.rotulo(uuid);
      }
    }

    let carregado = "";
    async function carregarImovel(uuid: string) {
      const doUsuario = escolhaDoUsuario;
      escolhaDoUsuario = false;
      const imovel = imoveisCache.get(uuid) ?? (await $service.buscarImovel(uuid));
      if (!imovel || form.imovelUuid !== uuid) return;
      form.imovelIdentificacao = imovel.identificacao;
      // Na edição, o dono gravado na conta só muda se o usuário trocar o imóvel.
      if (doUsuario || !props.edicao) {
        form.proprietarioUuid = imovel.proprietarioUuid;
        form.proprietarioNome = imovel.proprietarioNome;
      }
      imoveis.garantirAtual();
      const r = await $service.listarContratos({ imovelUuid: uuid, porPagina: 100 });
      if (form.imovelUuid !== uuid) return;
      contratos.value = r?.itens ?? [];
      if (!props.edicao && !form.contratoUuid) {
        const vigente = contratos.value.find((c) => c.status === "vigente");
        if (vigente) form.contratoUuid = vigente.uuid;
      }
    }

    // O pai preenche o form depois de carregar (edição) ou pelos query params (?imovelUuid=).
    watch(
      () => form.imovelUuid,
      (uuid) => {
        imoveis.garantirAtual();
        if (!uuid) {
          carregado = "";
          contratos.value = [];
          return;
        }
        if (uuid === carregado) return;
        carregado = uuid;
        void carregarImovel(uuid);
      },
      { immediate: true },
    );
    watch(
      () => [form.proprietarioUuid, form.proprietarioNome],
      () => proprietarios.garantirAtual(),
    );

    // Sem contrato, o inquilino não pode ser o responsável.
    watch(
      () => form.contratoUuid,
      (uuid) => {
        if (!uuid && form.responsavel === "inquilino") {
          form.responsavel = "proprietario";
        }
      },
    );

    function aoParcelar(ligado: boolean) {
      if (ligado) {
        form.paga = false;
        if (!form.primeiroVencimento) form.primeiroVencimento = form.vencimento;
        if (!form.valorParcela) form.valorParcela = form.valor;
      } else {
        if (!form.vencimento) form.vencimento = form.primeiroVencimento;
        if (!form.valor) form.valor = form.valorParcela;
      }
    }

    function aoMarcarPaga(ligado: boolean) {
      if (ligado && !form.pagoEm) form.pagoEm = hoje();
    }

    return {
      imoveis,
      proprietarios,
      contratoOpcoes,
      categorias,
      tipos: CONTA_TIPOS,
      esferas: CONTA_ESFERAS,
      responsaveis: computed(() =>
        CONTA_RESPONSAVEIS.map((r) => ({
          label: r.label,
          value: r.value,
          disable: r.value === "inquilino" && !form.contratoUuid,
        })),
      ),
      aoMudarTipo,
      aoMudarCategoria,
      aoMudarImovel,
      aoParcelar,
      aoMarcarPaga,
      hoje,
      // O tipo de Quasar não lista "month", mas o input nativo o aceita.
      tipoMes: "month" as unknown as "text",
    };
  },
});
</script>
