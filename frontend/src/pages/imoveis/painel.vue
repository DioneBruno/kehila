<template>
  <q-page padding>
    <div class="row items-center page-header q-mb-md">
      <div class="col">
        <p class="text-h5 text-weight-bold q-ma-none text-primary">Painel</p>
        <p class="text-caption text-grey-6 q-ma-none">Vencimentos, reajustes e imóveis livres</p>
      </div>
    </div>

    <div v-if="painel" class="row q-col-gutter-sm q-mb-md">
      <div v-for="c in cards" :key="c.chave" class="col-6 col-md-2">
        <q-card
          flat
          bordered
          v-ripple
          class="cursor-pointer text-center"
          :class="{ 'bg-red-1': c.chave === 'vencidos' && c.total > 0 }"
          :style="selecionado === c.chave ? 'outline: 2px solid var(--q-primary)' : undefined"
          @click="selecionado = c.chave"
        >
          <q-card-section class="q-pa-md">
            <div
              class="text-h4 text-weight-bold"
              :class="c.chave === 'vencidos' && c.total > 0 ? 'text-negative' : 'text-primary'"
            >
              {{ c.total }}
            </div>
            <div class="text-caption text-grey-7">{{ c.titulo }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card v-if="painel" flat bordered>
      <q-card-section>
        <p class="text-subtitle1 text-weight-bold q-ma-none">{{ cardAtual?.titulo }}</p>
      </q-card-section>
      <q-separator />
      <p v-if="!linhas.length" class="text-grey-6 q-pa-md q-ma-none">Nada por aqui.</p>
      <q-list v-else separator>
        <q-item v-for="l in linhas" :key="l.uuid" clickable v-ripple :to="l.to">
          <q-item-section>
            <q-item-label>{{ l.titulo }}</q-item-label>
            <q-item-label caption>{{ l.subtitulo }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="l.detalhe" side>
            <q-item-label :class="l.destaque ? 'text-negative text-weight-bold' : ''">
              {{ l.detalhe }}
            </q-item-label>
            <q-item-label v-if="l.detalhe2" caption>{{ l.detalhe2 }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs } from "vue";
import type { ContratoResumo, PainelImoveis } from "src/@modules/imoveis/painel.http";
import { ImoveisService, formatarData, formatarMoeda, labelIndice } from "./imoveis.service";

type Chave = Exclude<keyof PainelImoveis, never>;

const TITULOS: Record<Chave, string> = {
  vencidos: "Vencidos",
  vence0a30: "Vencem em 0–30 dias",
  vence31a60: "Vencem em 31–60 dias",
  vence61a90: "Vencem em 61–90 dias",
  reajustesMes: "Reajustes no mês",
  imoveisLivres: "Imóveis livres",
};
const CURTOS: Record<Chave, string> = {
  vencidos: "Vencidos",
  vence0a30: "0–30 dias",
  vence31a60: "31–60 dias",
  vence61a90: "61–90 dias",
  reajustesMes: "Reajustes no mês",
  imoveisLivres: "Livres",
};
const ORDEM: Chave[] = [
  "vencidos",
  "vence0a30",
  "vence31a60",
  "vence61a90",
  "reajustesMes",
  "imoveisLivres",
];

export default defineComponent({
  name: "ImoveisPainel",
  setup() {
    const $service = new ImoveisService();
    const data = reactive({
      painel: null as PainelImoveis | null,
      selecionado: "vence0a30" as Chave,
    });

    const cards = computed(() =>
      ORDEM.map((chave) => ({
        chave,
        titulo: CURTOS[chave],
        total: data.painel?.[chave].length ?? 0,
      })),
    );
    const cardAtual = computed(() => ({ titulo: TITULOS[data.selecionado] }));

    const linhas = computed(() => {
      const painel = data.painel;
      if (!painel) return [];
      if (data.selecionado === "imoveisLivres") {
        return painel.imoveisLivres.map((i) => ({
          uuid: i.uuid,
          titulo: i.identificacao,
          subtitulo: i.proprietarioNome,
          detalhe: "",
          detalhe2: "",
          destaque: false,
          to: { name: "imoveis.imoveis.detalhe", params: { uuid: i.uuid } },
        }));
      }
      const vencidos = data.selecionado === "vencidos";
      return (painel[data.selecionado] as ContratoResumo[]).map((c) => ({
        uuid: c.uuid,
        titulo: c.imovelIdentificacao,
        subtitulo: `${c.inquilinoNome} · ${c.proprietarioNome}`,
        detalhe:
          data.selecionado === "reajustesMes"
            ? `${labelIndice(c.indiceReajuste)} · ${formatarMoeda(c.valorAluguel)}`
            : `Fim em ${formatarData(c.fim)}`,
        detalhe2: data.selecionado === "reajustesMes" ? "" : formatarMoeda(c.valorAluguel),
        destaque: vencidos,
        to: { name: "imoveis.contratos.detalhe", params: { uuid: c.uuid } },
      }));
    });

    onMounted(async () => {
      data.painel = await $service.buscarPainel();
      // Abre no que exige ação: vencidos, se houver; senão o que vence nos próximos 30 dias.
      if (data.painel?.vencidos.length) data.selecionado = "vencidos";
    });

    return { ...toRefs(data), cards, cardAtual, linhas };
  },
});
</script>
